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

      const payload = {
        problemId,
        ...formData,
        timeline: {
          ...formData.timeline,
          startDate: formData.timeline.startDate || new Date(),
          endDate: formData.timeline.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          milestones: formData.timeline.milestones || [],
        },
        team: formData.team || [],
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
