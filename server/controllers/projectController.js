const mongoose = require("mongoose");
const Project = require("../models/Project");
const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const User = require("../models/User");
const {
  notifyAdmins,
  createNotification,
  notifyPartnerUser,
} = require("../services/notificationService");

// ========================================
// RESOLVE PARTNER FOR USER (SELF-HEALING)
// ========================================
const resolvePartnerForUser = async (user) => {
  if (!user) return { partner: null, partnerIds: [] };

  let partner = null;

  if (user.partner) {
    partner = await Partner.findById(user.partner);
  }

  if (!partner && user._id) {
    partner = await Partner.findOne({ user: user._id });
  }

  if (!partner && user.email) {
    partner = await Partner.findOne({ email: user.email.toLowerCase() });
    if (!partner) {
      const emailPrefix = user.email.split("@")[0].replace(/[._-]/g, " ").trim();
      partner = await Partner.findOne({
        name: new RegExp(`^${emailPrefix}$`, "i"),
      });
      if (!partner) {
        partner = await Partner.findOne({
          name: new RegExp(emailPrefix.split(" ")[0], "i"),
        });
      }
    }
  }

  if (!partner) {
    return { partner: null, partnerIds: [] };
  }

  if (String(user.partner || "") !== String(partner._id)) {
    user.partner = partner._id;
    await User.findByIdAndUpdate(user._id, { partner: partner._id }).catch(() => {});
  }

  const escapedName = partner.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const relatedPartners = await Partner.find({
    $or: [
      { _id: partner._id },
      { name: new RegExp(`^${escapedName}$`, "i") },
      { user: user._id },
    ],
  }).select("_id");

  const partnerIds = Array.from(
    new Set(relatedPartners.map((p) => p._id.toString()))
  ).map((id) => new mongoose.Types.ObjectId(id));

  return { partner, partnerIds };
};

// ========================================
// CREATE A PROJECT (UNIVERSITY PARTNER)
// ========================================
// A university spins up a professor + student team around a
// problem assigned to it. Guardrails:
//   - only university partners can create projects
//   - the problem must actually be assigned to them

const createProject = async (req, res) => {
  try {
    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const { title, description, problem: problemId, team, milestones } =
      req.body;

    if (!title || !description || !problemId) {
      return res.status(400).json({
        message: "Please provide a title, description and linked problem.",
      });
    }

    // The problem must be assigned to this university.

    const problem = await Problem.findOne({
      _id: problemId,
      assignedPartner: { $in: partnerIds },
    });

    if (!problem) {
      return res.status(400).json({
        message:
          "This problem is not assigned to your organization, so a project cannot be created for it.",
      });
    }

    // Basic shape-check on the incoming team so a malformed
    // payload becomes a clear 400 instead of a silent skip.

    const normalizedTeam = Array.isArray(team)
      ? team
          .filter((member) => member && member.name && member.role)
          .map((member) => ({
            name: String(member.name).trim(),

            role: member.role === "professor" ? "professor" : "student",

            department: String(member.department || "").trim(),

            email: String(member.email || "").trim().toLowerCase(),
          }))
      : [];

    const normalizedMilestones = Array.isArray(milestones)
      ? milestones
          .filter((milestone) => milestone && String(milestone.title).trim())
          .map((milestone) => ({
            title: String(milestone.title).trim(),

            completed: Boolean(milestone.completed),

            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
          }))
      : [];

    try {
      const project = await Project.create({
        title: title.trim(),

        description: description.trim(),

        problem: problem._id,

        partner: partner._id,

        team: normalizedTeam,

        milestones: normalizedMilestones,

        createdBy: req.user._id,
      });

      const populated = await Project.findById(project._id)
        .populate("problem", "title status category location")
        .populate("partner", "name type location");

      // ========================================
      // NOTIFY ADMINS + CITIZEN
      // ========================================
      // Government tracks university participation; the
      // citizen sees work starting on their problem.

      await notifyAdmins({
        type: "project_created",

        title: "New solution project",

        message: `${partner.name} started the project "${populated.title}" for "${problem.title}".`,

        problemId: problem._id,
      });

      await createNotification({
        recipientId: problem.submittedBy,

        type: "project_created",

        title: "Work has started",

        message: `${partner.name} started the project "${populated.title}" on your problem "${problem.title}".`,

        problemId: problem._id,
      });

      return res.status(201).json({
        message: "Project created successfully.",

        project: populated,
      });
    } catch (createError) {
      // Duplicate key = a project already exists for this
      // problem + partner pair.

      if (createError.code === 11000) {
        return res.status(409).json({
          message:
            "A project already exists for this problem. Open it from your projects list instead.",
        });
      }

      throw createError;
    }
  } catch (error) {
    console.error("Create project error:", error.message);

    return res.status(500).json({
      message: "Server error while creating project.",
    });
  }
};

// ========================================
// GET MY PROJECTS
// ========================================
// Universities see projects they lead; industry and other
// partners also see projects they are collaborating on.

const getMyProjects = async (req, res) => {
  try {
    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const projects = await Project.find({
      $or: [
        { partner: { $in: partnerIds } },
        { "collaborators.partner": { $in: partnerIds } },
      ],
    })
      .populate("problem", "title status category location")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location expertise")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: projects.length,

      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching projects.",
    });
  }
};

// ========================================
// INVITE A COLLABORATOR (LEAD UNIVERSITY)
// ========================================
// The university leading a project invites an industry
// partner, startup, MSME or CSR organization into a defined
// role: mentor, funder, co-developer or adopter.

const inviteCollaborator = async (req, res) => {
  try {
    const { partnerId, role } = req.body;

    const allowedRoles = ["mentor", "funder", "co-developer", "adopter"];

    if (!partnerId || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Please provide a partner and a valid role (mentor, funder, co-developer or adopter).",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,

      partner: req.user.partner,
    });

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found or you do not lead this project.",
      });
    }

    const collaboratorPartner = await Partner.findById(partnerId);

    if (!collaboratorPartner) {
      return res.status(404).json({
        message: "Partner organization not found.",
      });
    }

    if (collaboratorPartner._id.equals(project.partner)) {
      return res.status(400).json({
        message: "Your organization already leads this project.",
      });
    }

    // One live engagement per partner per project — an already
    // invited, requested or accepted partner cannot be invited
    // again.

    const liveCollaborator = project.collaborators.find(
      (collaborator) =>
        collaborator.partner.equals(collaboratorPartner._id) &&
        ["invited", "requested", "accepted"].includes(collaborator.status),
    );

    if (liveCollaborator) {
      return res.status(409).json({
        message:
          liveCollaborator.status === "invited"
            ? "This partner already has a pending invitation."
            : liveCollaborator.status === "requested"
              ? "This partner already has a pending collaboration request."
              : "This partner is already collaborating on the project.",
      });
    }

    const collaborator = {
      partner: collaboratorPartner._id,

      role,

      status: "invited",

      contributions: [],

      invitedBy: req.user._id,

      respondedAt: null,
    };

    project.collaborators.push(collaborator);

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location expertise");

    // ========================================
    // NOTIFY INVITED PARTNER + ADMINS
    // ========================================

    await notifyPartnerUser({
      partnerId: collaboratorPartner._id,

      type: "collaboration_invited",

      title: "Collaboration invitation",

      message: `${populated.partner.name} invited you to join "${populated.title}" as a ${role.replace("-", " ")} on the problem "${populated.problem.title}".`,

      problemId: populated.problem._id,
    });

    await notifyAdmins({
      type: "collaboration_invited",

      title: "Industry collaboration invite sent",

      message: `${populated.partner.name} invited ${collaboratorPartner.name} as a ${role.replace("-", " ")} on "${populated.title}".`,

      problemId: populated.problem._id,
    });

    return res.status(201).json({
      message: `Invitation sent to ${collaboratorPartner.name}.`,

      project: populated,
    });
  } catch (error) {
    console.error("Invite collaborator error:", error.message);

    return res.status(500).json({
      message: "Server error while sending invitation.",
    });
  }
};

// ========================================
// RESPOND TO AN INVITATION OR REQUEST
// ========================================
// Two flows share this endpoint:
//   - a partner invited by the lead responds for itself
//     (status "invited"), or
//   - the lead university responds to a partner's request to
//     join (status "requested").
// Accepting makes the partner an active collaborator; both
// outcomes notify the other side and admins.

const respondToInvite = async (req, res) => {
  try {
    const { response } = req.body;

    if (!["accepted", "declined"].includes(response)) {
      return res.status(400).json({
        message: "Response must be either accepted or declined.",
      });
    }

    const { partner, partnerIds } = await resolvePartnerForUser(req.user);
    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    let collaborator = project.collaborators.find((entry) =>
      entry.partner && partnerIds.some((id) => String(id) === String(entry.partner))
    );

    let actingAs = "collaborator";

    if (!(collaborator && collaborator.status === "invited")) {
      // Not an invited partner responding — must be the lead
      // university answering a collaboration request.

      const isLead = partnerIds.some((id) => String(id) === String(project.partner));

      if (!isLead) {
        return res.status(403).json({
          message:
            "Only the lead university can respond to this collaboration request.",
        });
      }

      collaborator = project.collaborators.id(req.params.collaboratorId);

      if (!collaborator) {
        return res.status(404).json({
          message: "Collaboration record not found.",
        });
      }

      if (collaborator.status !== "requested") {
        return res.status(400).json({
          message: "This collaboration request is no longer pending.",
        });
      }

      actingAs = "lead";
    }

    collaborator.status = response;

    collaborator.respondedAt = new Date();

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location expertise");

    const matchedCollab = populated.collaborators.find((entry) =>
      entry.partner &&
      (entry.partner._id
        ? entry.partner._id.equals(collaborator.partner)
        : String(entry.partner) === String(collaborator.partner))
    );

    const collaboratorPartner = matchedCollab?.partner || { name: "Partner" };

    const responseLabel = response === "accepted" ? "accepted" : "declined";

    // ========================================
    // NOTIFY THE OTHER SIDE + ADMINS
    // ========================================

    if (actingAs === "lead") {
      // Lead answered a partner's request — notify requester.

      await notifyPartnerUser({
        partnerId: collaborator.partner,

        type: "collaboration_request_responded",

        title: `Collaboration request ${responseLabel}`,

        message: `${populated.partner.name} ${responseLabel} your request to join "${populated.title}" as a ${collaborator.role.replace("-", " ")}.`,

        problemId: populated.problem._id,
      });

      await notifyAdmins({
        type: "collaboration_request_responded",

        title: `Collaboration request ${responseLabel}`,

        message: `${populated.partner.name} ${responseLabel} ${collaboratorPartner.name}'s request to join "${populated.title}".`,

        problemId: populated.problem._id,
      });
    } else {
      // Partner answered the lead's invitation — notify lead.

      await notifyPartnerUser({
        partnerId: project.partner,

        type: "collaboration_responded",

        title: `Invitation ${responseLabel}`,

        message: `${collaboratorPartner.name} ${responseLabel} your invitation to collaborate on "${populated.title}" as a ${collaborator.role.replace("-", " ")}.`,

        problemId: populated.problem._id,
      });

      await notifyAdmins({
        type: "collaboration_responded",

        title: `Collaboration invitation ${responseLabel}`,

        message: `${collaboratorPartner.name} ${responseLabel} the invitation from ${populated.partner.name} to collaborate on "${populated.title}".`,

        problemId: populated.problem._id,
      });
    }

    return res.status(200).json({
      message:
        actingAs === "lead"
          ? `Request ${responseLabel}.`
          : `Invitation ${responseLabel}.`,

      project: populated,
    });
  } catch (error) {
    console.error("Respond to invite error:", error.message);

    return res.status(500).json({
      message: "Server error while responding to invitation.",
    });
  }
};

// ========================================
// WITHDRAW A COLLABORATOR (LEAD UNIVERSITY)
// ========================================
// The lead can cancel a pending invitation or remove an
// active collaborator. Records are kept (status becomes
// "withdrawn") so the collaboration history stays auditable.

const withdrawCollaborator = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,

      partner: req.user.partner,
    });

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found or you do not lead this project.",
      });
    }

    const collaborator = project.collaborators.id(req.params.collaboratorId);

    if (!collaborator) {
      return res.status(404).json({
        message: "Collaboration record not found.",
      });
    }

    if (!["invited", "requested", "accepted"].includes(collaborator.status)) {
      return res.status(400).json({
        message: "Only pending or active collaborations can be withdrawn.",
      });
    }

    const wasAccepted = collaborator.status === "accepted";

    const wasRequested = collaborator.status === "requested";

    const collaboratorPartnerId = collaborator.partner;

    collaborator.status = "withdrawn";

    collaborator.respondedAt = new Date();

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location expertise");

    // ========================================
    // NOTIFY COLLABORATOR + ADMINS
    // ========================================

    const actionLabel = wasAccepted
      ? "removed from"
      : wasRequested
        ? "declined the collaboration request from"
        : "withdrew the invitation for";

    await notifyPartnerUser({
      partnerId: collaboratorPartnerId,

      type: "collaboration_responded",

      title: wasAccepted ? "Removed from project" : "Invitation withdrawn",

      message: `${populated.partner.name} ${actionLabel} the project "${populated.title}".`,

      problemId: populated.problem._id,
    });

    await notifyAdmins({
      type: "collaboration_responded",

      title: wasAccepted ? "Collaborator removed" : "Invitation withdrawn",

      message: `${populated.partner.name} ${actionLabel} a collaboration on "${populated.title}".`,

      problemId: populated.problem._id,
    });

    return res.status(200).json({
      message: "Collaboration withdrawn successfully.",

      project: populated,
    });
  } catch (error) {
    console.error("Withdraw collaborator error:", error.message);

    return res.status(500).json({
      message: "Server error while withdrawing collaboration.",
    });
  }
};

// ========================================
// ADD A CONTRIBUTION (ACTIVE COLLABORATOR)
// ========================================
// Collaborating partners log what they brought to the
// project — mentorship sessions, funding, prototypes,
// pilot deployments. Visible to the lead, admins and the
// citizen through project updates.

const addContribution = async (req, res) => {
  try {
    const { title, detail } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        message: "Please provide a contribution title.",
      });
    }

    const { partner, partnerIds } = await resolvePartnerForUser(req.user);
    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      "collaborators.partner": { $in: partnerIds },
    });

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found or your organization is not collaborating on it.",
      });
    }

    const collaborator = project.collaborators.find((entry) =>
      entry.partner && partnerIds.some((id) => String(id) === String(entry.partner))
    );

    if (!collaborator || collaborator.status !== "accepted") {
      return res.status(403).json({
        message: "Only accepted collaborators can log contributions.",
      });
    }

    collaborator.contributions.push({
      title: String(title).trim(),

      detail: String(detail || "").trim(),
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location expertise");

    const matchedCollab = populated.collaborators.find((entry) =>
      entry.partner &&
      (entry.partner._id
        ? entry.partner._id.equals(req.user.partner)
        : String(entry.partner) === String(req.user.partner))
    );

    const collaboratorPartner = matchedCollab?.partner || { name: "Collaborator" };

    // ========================================
    // NOTIFY LEAD UNIVERSITY + ADMINS
    // ========================================

    await notifyPartnerUser({
      partnerId: project.partner,

      type: "collaboration_contribution",

      title: "New collaboration contribution",

      message: `${collaboratorPartner.name} logged "${String(title).trim()}" on the project "${populated.title}".`,

      problemId: populated.problem._id,
    });

    await notifyAdmins({
      type: "collaboration_contribution",

      title: "New collaboration contribution",

      message: `${collaboratorPartner.name} logged "${String(title).trim()}" on "${populated.title}" as a ${collaborator.role.replace("-", " ")}.`,

      problemId: populated.problem._id,
    });

    return res.status(201).json({
      message: "Contribution logged successfully.",

      project: populated,
    });
  } catch (error) {
    console.error("Add contribution error:", error.message);

    return res.status(500).json({
      message: "Server error while logging contribution.",
    });
  }
};

// ========================================
// UPDATE PROJECT STATUS
// ========================================

const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["planning", "active", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid project status.",
      });
    }

    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      partner: { $in: partnerIds },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you do not have permission to update it.",
      });
    }

    project.status = status;

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location submittedBy")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location");

    // ========================================
    // NOTIFY ADMINS + CITIZEN & SYNC TO PROBLEM
    // ========================================

    if (status === "completed") {
      const problem = await Problem.findById(project.problem);
      if (problem) {
        problem.resolutionSubmitted = true;
        problem.resolutionDetails = {
          projectId: project._id,
          projectTitle: project.title,
          leadPartner: populated.partner?.name,
          collaborators: (populated.collaborators || [])
            .filter((c) => c.status === "accepted")
            .map((c) => c.partner?.name)
            .filter(Boolean),
          outcomes: populated.outcomes,
          submittedAt: new Date(),
          summary: populated.description,
        };
        if (problem.status === "assigned" || problem.status === "submitted" || problem.status === "under_review") {
          problem.status = "in_progress";
        }
        await problem.save();
      }

      await notifyAdmins({
        type: "project_updated",
        title: "Action Required: Project Completed & Resolution Submitted",
        message: `${populated.partner.name} completed project "${populated.title}" with industry collaboration. Please review and approve resolution in Government Portal.`,
        problemId: populated.problem._id,
      });
    } else {
      await notifyAdmins({
        type: "project_updated",
        title: "Project status updated",
        message: `${populated.partner.name} moved "${populated.title}" to ${status}.`,
        problemId: populated.problem._id,
      });
    }

    if (populated.problem && populated.problem.submittedBy) {
      await createNotification({
        recipientId: populated.problem.submittedBy,

        type: "project_updated",

        title: status === "completed" ? "Solution Ready for Government Review" : "Solution progress update",

        message:
          status === "completed"
            ? `The university team and industry partners completed their solution project "${populated.title}" for your problem. It is currently under government review for final resolution!`
            : `The project "${populated.title}" on your problem is now ${status}.`,

        problemId: populated.problem._id,
      });
    }

    return res.status(200).json({
      message: "Project status updated successfully.",

      project: populated,
    });
  } catch (error) {
    console.error("Update project status error:", error.message);

    return res.status(500).json({
      message: "Server error while updating project status.",
    });
  }
};

// ========================================
// TOGGLE A MILESTONE
// ========================================

const toggleMilestone = async (req, res) => {
  try {
    const { milestoneIndex } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,

      partner: req.user.partner,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you do not have permission to update it.",
      });
    }

    const index = Number(milestoneIndex);

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= project.milestones.length
    ) {
      return res.status(400).json({
        message: "Invalid milestone.",
      });
    }

    project.milestones[index].completed =
      !project.milestones[index].completed;

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location submittedBy")
      .populate("partner", "name type location");

    const milestone = populated.milestones[index];

    // ========================================
    // NOTIFY ADMINS + CITIZEN
    // ========================================

    await notifyAdmins({
      type: "project_updated",

      title: milestone.completed ? "Milestone completed" : "Milestone reopened",

      message: `${populated.partner.name} ${milestone.completed ? "completed" : "reopened"} the milestone "${milestone.title}" on "${populated.title}".`,

      problemId: populated.problem._id,
    });

    if (populated.problem.submittedBy) {
      await createNotification({
        recipientId: populated.problem.submittedBy,

        type: "project_updated",

        title: milestone.completed
          ? "Milestone completed"
          : "Milestone reopened",

        message: `Milestone "${milestone.title}" on the project "${populated.title}" for your problem was ${milestone.completed ? "completed" : "reopened"}.`,

        problemId: populated.problem._id,
      });
    }

    return res.status(200).json({
      message: "Milestone updated successfully.",

      project: populated,
    });
  } catch (error) {
    console.error("Toggle milestone error:", error.message);

    return res.status(500).json({
      message: "Server error while updating milestone.",
    });
  }
};

// ========================================
// SET A MILESTONE DUE DATE
// ========================================
// Lead university only. Lets the lead plan the project
// timeline; overdue (past due, not completed) milestones are
// highlighted in the workspace and countable on the
// government dashboard.

const setMilestoneDueDate = async (req, res) => {
  try {
    const { milestoneIndex, dueDate } = req.body;

    if (!req.user.partner) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,

      partner: req.user.partner,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you do not have permission to update it.",
      });
    }

    const index = Number(milestoneIndex);

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= project.milestones.length
    ) {
      return res.status(400).json({
        message: "Invalid milestone.",
      });
    }

    if (dueDate !== null && dueDate !== "" && dueDate !== undefined) {
      const parsed = new Date(dueDate);

      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({
          message: "Invalid due date.",
        });
      }

      project.milestones[index].dueDate = parsed;
    } else {
      project.milestones[index].dueDate = null;
    }

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location submittedBy")
      .populate("partner", "name type location");

    return res.status(200).json({
      message: "Milestone due date updated successfully.",

      project: populated,
    });
  } catch (error) {
    console.error("Set milestone due date error:", error.message);

    return res.status(500).json({
      message: "Server error while updating milestone due date.",
    });
  }
};

// ========================================
// UPDATE INNOVATION OUTCOMES
// ========================================
// Only the lead university can record measurable project
// outcomes: patents, startups, publications, deployments.
// These feed the government analytics dashboard's
// "Innovation Outcomes" panel.

const updateProjectOutcomes = async (req, res) => {
  try {
    if (!req.user.partner) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const { patents, startups, publications, deployments } = req.body;

    // ========================================
    // VALIDATE NUMBERS
    // ========================================

    const fields = { patents, startups, publications, deployments };

    for (const [name, value] of Object.entries(fields)) {
      if (
        value !== undefined &&
        (Number.isNaN(Number(value)) || Number(value) < 0)
      ) {
        return res.status(400).json({
          message: `Invalid value for ${name}.`,
        });
      }
    }

    const project = await Project.findOne({
      _id: req.params.id,

      partner: req.user.partner,
    });

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found or you do not have permission to update it.",
      });
    }

    project.outcomes = {
      ...project.outcomes.toObject(),

      ...Object.fromEntries(
        Object.entries(fields)
          .filter(([, value]) => value !== undefined)
          .map(([name, value]) => [name, Math.floor(Number(value))]),
      ),
    };

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location submittedBy")
      .populate("partner", "name type location");

    return res.status(200).json({
      message: "Innovation outcomes updated successfully.",

      project: populated,
    });
  } catch (error) {
    console.error("Update project outcomes error:", error.message);

    return res.status(500).json({
      message: "Server error while updating innovation outcomes.",
    });
  }
};

// ========================================
// REQUEST TO COLLABORATE (PARTNER-INITIATED)
// ========================================
// The reverse of inviteCollaborator: a partner browsing the
// directory asks to join a university-led project in a given
// role. The lead university then accepts or declines via the
// shared respond endpoint. Guards:
//   - requester must not be the lead
//   - no live invitation / request / collaboration already
//   - project must still be open (planning or active)

const requestCollaboration = async (req, res) => {
  try {
    if (!req.user.partner) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const { role, message } = req.body;

    const allowedRoles = ["mentor", "funder", "co-developer", "adopter"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Please choose a valid role (mentor, funder, co-developer or adopter).",
      });
    }

    const project = await Project.findById(req.params.id).populate(
      "partner",
      "name type",
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (project.partner._id.equals(req.user.partner)) {
      return res.status(400).json({
        message: "Your organization already leads this project.",
      });
    }

    if (!["planning", "active"].includes(project.status)) {
      return res.status(400).json({
        message: "This project is completed and no longer open for requests.",
      });
    }

    const liveCollaborator = project.collaborators.find(
      (collaborator) =>
        collaborator.partner.equals(req.user.partner) &&
        ["invited", "requested", "accepted"].includes(collaborator.status),
    );

    if (liveCollaborator) {
      return res.status(409).json({
        message:
          liveCollaborator.status === "requested"
            ? "You already have a pending request for this project."
            : liveCollaborator.status === "invited"
              ? "The university has already invited you — respond to the invitation instead."
              : "Your organization is already collaborating on this project.",
      });
    }

    const collaborator = {
      partner: req.user.partner,

      role,

      status: "requested",

      message: String(message || "").trim().slice(0, 500),

      contributions: [],

      invitedBy: req.user._id,

      respondedAt: null,
    };

    project.collaborators.push(collaborator);

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location expertise");

    const requester = await Partner.findById(req.user.partner);

    // ========================================
    // NOTIFY LEAD UNIVERSITY + ADMINS
    // ========================================

    await notifyPartnerUser({
      partnerId: project.partner._id || project.partner,

      type: "collaboration_requested",

      title: "Collaboration request",

      message: `${requester.name} asked to join "${populated.title}" as a ${role.replace("-", " ")}.`,

      problemId: populated.problem._id,
    });

    await notifyAdmins({
      type: "collaboration_requested",

      title: "Partner collaboration request",

      message: `${requester.name} requested to join "${populated.title}" (lead: ${populated.partner.name}) as a ${role.replace("-", " ")}.`,

      problemId: populated.problem._id,
    });

    return res.status(201).json({
      message: `Request sent to ${populated.partner.name}.`,

      project: populated,
    });
  } catch (error) {
    console.error("Request collaboration error:", error.message);

    return res.status(500).json({
      message: "Server error while sending collaboration request.",
    });
  }
};

// ========================================
// GET A SINGLE PROJECT (SHARED WORKSPACE)
// ========================================
// Accessible to the lead university and any live collaborator
// (invited, requested or accepted). Returns the caller's
// relation so the UI can render role-based actions.

const getProjectById = async (req, res) => {
  try {
    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isLead = partnerIds.some(
      (id) => String(id) === String(project.partner)
    );

    const myCollaborator = (project.collaborators || []).find((entry) =>
      entry.partner &&
      partnerIds.some((id) => String(id) === String(entry.partner))
    );

    const isCollaborator =
      myCollaborator &&
      ["invited", "requested", "accepted"].includes(myCollaborator.status);

    if (!isLead && !isCollaborator) {
      return res.status(403).json({
        message:
          "You do not have access to this project. Collaborate on it first.",
      });
    }

    const populated = await Project.findById(project._id)
      .populate("problem", "title status category location description")
      .populate("partner", "name type location")
      .populate("collaborators.partner", "name type location expertise");

    return res.status(200).json({
      project: populated,

      viewerRole: isLead ? "lead" : "collaborator",

      myCollaboration: isCollaborator
        ? {
            _id: myCollaborator._id,

            status: myCollaborator.status,

            role: myCollaborator.role,
          }
        : null,
    });
  } catch (error) {
    console.error("Get project error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching the project.",
    });
  }
};

// ========================================
// POST PROJECT MESSAGE (COLLABORATION DISCUSSION)
// ========================================
const postProjectMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please provide a message.",
      });
    }

    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const project = await Project.findById(req.params.id)
      .populate("partner", "name type")
      .populate("collaborators.partner", "name type");

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isLead = partnerIds.some(
      (id) => String(id) === String(project.partner?._id || project.partner)
    );

    const isCollaborator = (project.collaborators || []).some(
      (c) =>
        c.partner &&
        partnerIds.some((id) => String(id) === String(c.partner._id || c.partner)) &&
        ["invited", "accepted"].includes(c.status)
    );

    if (!isLead && !isCollaborator) {
      return res.status(403).json({
        message: "You are not a participant in this project collaboration.",
      });
    }

    const senderRole = isLead ? "lead" : "collaborator";
    const newMessage = {
      sender: req.user._id,
      senderPartner: partner._id,
      senderName: `${partner.name} (${isLead ? "Lead University" : "Industry Partner"})`,
      senderRole,
      message: message.trim(),
      createdAt: new Date(),
    };

    project.messages.push(newMessage);
    await project.save();

    // Notify the counterpart organization
    if (isCollaborator) {
      await notifyPartnerUser({
        partnerId: project.partner._id || project.partner,
        type: "project_updated",
        title: `New message from ${partner.name}`,
        message: `${partner.name} posted in "${project.title}": "${message.trim().slice(0, 100)}${message.trim().length > 100 ? "..." : ""}"`,
        problemId: project.problem,
      }).catch(() => {});
    } else {
      for (const col of project.collaborators || []) {
        if (col.partner && ["invited", "accepted"].includes(col.status)) {
          await notifyPartnerUser({
            partnerId: col.partner._id || col.partner,
            type: "project_updated",
            title: `New update from ${project.partner.name}`,
            message: `${project.partner.name} posted in "${project.title}": "${message.trim().slice(0, 100)}${message.trim().length > 100 ? "..." : ""}"`,
            problemId: project.problem,
          }).catch(() => {});
        }
      }
    }

    return res.status(201).json({
      message: "Message sent successfully.",
      messages: project.messages,
    });
  } catch (error) {
    console.error("Post project message error:", error.message);
    return res.status(500).json({
      message: "Server error while posting message.",
    });
  }
};

// ========================================
// GET PROJECT MESSAGES
// ========================================
const getProjectMessages = async (req, res) => {
  try {
    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      messages: project.messages || [],
    });
  } catch (error) {
    console.error("Get project messages error:", error.message);
    return res.status(500).json({
      message: "Server error while fetching project messages.",
    });
  }
};

module.exports = {
  createProject,
  getMyProjects,
  updateProjectStatus,
  toggleMilestone,
  setMilestoneDueDate,

  updateProjectOutcomes,
  inviteCollaborator,
  respondToInvite,
  withdrawCollaborator,
  addContribution,
  requestCollaboration,
  getProjectById,
  postProjectMessage,
  getProjectMessages,
};
