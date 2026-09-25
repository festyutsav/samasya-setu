import { useState } from "react";
import { createProposal } from "../services/proposalService";

// ========================================
// PROPOSAL FORM
// ========================================
// Allows a university partner to submit a
// solution proposal for an assigned problem.

const ProposalForm = ({
  problemId,
  onProposalSubmitted,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    approach: "",
    team: [],
    timeline: {
      startDate: "",
      endDate: "",
      milestones: [],
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // ========================================
  // HANDLE CHANGE
  // ========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ========================================
  // MILESTONE BUILDER HELPERS
  // ========================================

  const addMilestone = () => {
    setFormData((current) => ({
      ...current,
      timeline: {
        ...current.timeline,
        milestones: [
          ...(current.timeline?.milestones || []),
          { title: "", dueDate: "" },
        ],
      },
    }));
  };

  const removeMilestone = (index) => {
    setFormData((current) => ({
      ...current,
      timeline: {
        ...current.timeline,
        milestones: (current.timeline?.milestones || []).filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormData((current) => {
      const updated = [...(current.timeline?.milestones || [])];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...current,
        timeline: {
          ...current.timeline,
          milestones: updated,
        },
      };
    });
  };

  // ========================================
  // TEAM BUILDER HELPERS
  // ========================================

  const addTeamMember = () => {
    setFormData((current) => ({
      ...current,
      team: [
        ...(current.team || []),
        { name: "", role: "professor", email: "" },
      ],
    }));
  };

  const removeTeamMember = (index) => {
    setFormData((current) => ({
      ...current,
      team: (current.team || []).filter((_, i) => i !== index),
    }));
  };

  const handleTeamMemberChange = (index, field, value) => {
    setFormData((current) => {
      const updated = [...(current.team || [])];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...current,
        team: updated,
      };
    });
  };

  // ========================================
  // HANDLE SUBMIT
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");
        setMessageType("error");
        return;
      }

      // Filter and clean milestones
      const validMilestones = (formData.timeline?.milestones || [])
        .filter((m) => m && m.title && m.title.trim())
        .map((m) => ({
          title: m.title.trim(),
          dueDate: m.dueDate ? new Date(m.dueDate) : null,
          status: "pending",
        }));

      // Validate team members: if any field entered, require name and email
      const rawTeam = formData.team || [];
      const incompleteMember = rawTeam.some(
        (m) =>
          (m.name?.trim() || m.email?.trim()) &&
          (!m.name?.trim() || !m.email?.trim())
      );

      if (incompleteMember) {
        setMessage("Please provide both name and email for every team member added.");
        setMessageType("error");
        setSubmitting(false);
        return;
      }

      const validTeam = rawTeam
        .filter((m) => m && m.name && m.name.trim() && m.email && m.email.trim())
        .map((m) => ({
          name: m.name.trim(),
          role: m.role === "professor" ? "professor" : "student",
          email: m.email.trim().toLowerCase(),
        }));

      const payload = {
        problemId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        approach: formData.approach.trim(),
        timeline: {
          startDate: formData.timeline.startDate || new Date(),
          endDate:
            formData.timeline.endDate ||
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          milestones: validMilestones,
        },
        team: validTeam,
        documents: [],
      };

      const response = await createProposal(payload, token);

      setMessage("Proposal submitted successfully!");
      setMessageType("success");

      setFormData({
        title: "",
        description: "",
        approach: "",
        team: [],
        timeline: {
          startDate: "",
          endDate: "",
          milestones: [],
        },
      });

      if (onProposalSubmitted) {
        onProposalSubmitted(response?.proposal || response);
      }
    } catch (error) {
      console.error("Submit proposal error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to submit proposal."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#173d3a]">
        Submit Solution Proposal
      </h2>

      <p className="mt-1 text-sm text-[#71827c]">
        Describe your university&apos;s approach to solving this problem.
      </p>

      {message && (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            messageType === "success"
              ? "border-[#bcd9cf] bg-[#e9f4f0] text-[#087f70]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* TITLE */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#315d56]">
            Proposal Title *
          </label>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g. Solar-Powered Street Lighting System"
            className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
          />
        </div>

        {/* DESCRIPTION */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#315d56]">
            Problem Analysis *
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Analyze the problem and its impact..."
            className="w-full resize-none rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
          />
        </div>

        {/* APPROACH */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#315d56]">
            Proposed Approach *
          </label>

          <textarea
            name="approach"
            value={formData.approach}
            onChange={handleChange}
            required
            rows="5"
            placeholder="Describe your technical/process solution, methodology, and expected outcomes..."
            className="w-full resize-none rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
          />
        </div>

        {/* TIMELINE */}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#315d56]">
              Start Date
            </label>

            <input
              type="date"
              name="startDate"
              value={formData.timeline.startDate}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  timeline: {
                    ...current.timeline,
                    startDate: event.target.value,
                  },
                }))
              }
              className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#315d56]">
              Expected End Date
            </label>

            <input
              type="date"
              name="endDate"
              value={formData.timeline.endDate}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  timeline: {
                    ...current.timeline,
                    endDate: event.target.value,
                  },
                }))
              }
              className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
            />
          </div>
        </div>

        {/* MILESTONES BUILDER */}
        <div className="rounded-xl border border-[#dbe5df] bg-[#fbfdfc] p-4.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="block text-sm font-semibold text-[#315d56]">
                Milestone Plan (Optional)
              </label>
              <p className="text-xs text-[#71827c]">
                Define specific project deliverables and completion dates for your workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={addMilestone}
              className="inline-flex items-center gap-1 rounded-lg border border-[#bcd9cf] bg-[#e9f4f0] px-3 py-1.5 text-xs font-semibold text-[#087f70] hover:bg-[#d8ebe4] transition"
            >
              + Add Milestone
            </button>
          </div>

          {(formData.timeline?.milestones || []).length === 0 ? (
            <p className="mt-3 text-xs italic text-[#a1aca7]">
              No custom milestones added. If approved, default baseline milestones will be applied.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {(formData.timeline?.milestones || []).map((milestone, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e3e9e3] bg-white p-2.5 shadow-xs"
                >
                  <span className="text-xs font-bold text-[#8fb5ad] w-6 text-center shrink-0">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder="Milestone title (e.g. Field Assessment & Baseline Study)"
                    value={milestone.title}
                    onChange={(e) => handleMilestoneChange(idx, "title", e.target.value)}
                    required
                    className="flex-1 min-w-[200px] rounded-lg border border-[#dbe5df] px-3 py-1.5 text-xs outline-none focus:border-[#62a99b] focus:ring-1 focus:ring-[#62a99b]"
                  />
                  <input
                    type="date"
                    value={milestone.dueDate}
                    onChange={(e) => handleMilestoneChange(idx, "dueDate", e.target.value)}
                    className="rounded-lg border border-[#dbe5df] px-2.5 py-1.5 text-xs text-[#5c6f69] outline-none focus:border-[#62a99b]"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(idx)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition shrink-0"
                    title="Remove milestone"
                    aria-label={`Remove milestone ${idx + 1}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TEAM MEMBERS BUILDER */}
        <div className="rounded-xl border border-[#dbe5df] bg-[#fbfdfc] p-4.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="block text-sm font-semibold text-[#315d56]">
                Team Members (Optional)
              </label>
              <p className="text-xs text-[#71827c]">
                List professors and student researchers collaborating on this proposal.
              </p>
            </div>
            <button
              type="button"
              onClick={addTeamMember}
              className="inline-flex items-center gap-1 rounded-lg border border-[#bcd9cf] bg-[#e9f4f0] px-3 py-1.5 text-xs font-semibold text-[#087f70] hover:bg-[#d8ebe4] transition"
            >
              + Add Member
            </button>
          </div>

          {(formData.team || []).length === 0 ? (
            <p className="mt-3 text-xs italic text-[#a1aca7]">
              No team members added yet. Team structure can also be updated inside the project workspace.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {(formData.team || []).map((member, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e3e9e3] bg-white p-2.5 shadow-xs"
                >
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={member.name}
                    onChange={(e) => handleTeamMemberChange(idx, "name", e.target.value)}
                    required
                    className="flex-1 min-w-[130px] rounded-lg border border-[#dbe5df] px-3 py-1.5 text-xs outline-none focus:border-[#62a99b] focus:ring-1 focus:ring-[#62a99b]"
                  />
                  <select
                    value={member.role}
                    onChange={(e) => handleTeamMemberChange(idx, "role", e.target.value)}
                    className="rounded-lg border border-[#dbe5df] px-2.5 py-1.5 text-xs text-[#315d56] outline-none focus:border-[#62a99b] bg-white"
                  >
                    <option value="professor">Professor / Mentor</option>
                    <option value="student">Student / Researcher</option>
                  </select>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={member.email}
                    onChange={(e) => handleTeamMemberChange(idx, "email", e.target.value)}
                    required
                    className="flex-1 min-w-[140px] rounded-lg border border-[#dbe5df] px-3 py-1.5 text-xs outline-none focus:border-[#62a99b] focus:ring-1 focus:ring-[#62a99b]"
                  />
                  <button
                    type="button"
                    onClick={() => removeTeamMember(idx)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition shrink-0"
                    title="Remove member"
                    aria-label={`Remove team member ${idx + 1}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#0b514a] px-4 py-3 font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
        >
          {submitting ? "Submitting..." : "Submit Proposal"}
        </button>
      </form>
    </div>
  );
};

export default ProposalForm;
