import { useEffect, useRef, useState } from "react";

import { createProblem } from "../services/problemService";

import { predictCategory } from "../services/aiService";

import LocationPicker from "../components/LocationPicker";

// ========================================
// INITIAL FORM DATA
// ========================================

const initialFormData = {
  title: "",
  description: "",
  category: "",
  location: "",

  locationDetails: {
    district: "",
    state: "Jharkhand",
    pincode: "",
    latitude: null,
    longitude: null,
  },

  affectedPeople: "",
  severity: "medium",
};

// ========================================
// AI CATEGORY → FORM VALUE
// ========================================
// AI gives:
// "Transportation"
//
// Form needs:
// "transportation"

const aiCategoryMap = {
  Agriculture: "agriculture",
  Healthcare: "healthcare",
  Education: "education",
  "Water Management": "water",
  Environment: "environment",
  Transportation: "transportation",
  Energy: "energy",
  "Waste Management": "waste",
  "Public Safety": "public_safety",
  Technology: "technology",
  Other: "other",
};

// ========================================
// FORM VALUE → DISPLAY NAME
// ========================================

const categoryNames = {
  agriculture: "Agriculture",
  healthcare: "Healthcare",
  education: "Education",
  water: "Water Management",
  environment: "Environment",
  transportation: "Transportation",
  energy: "Energy",
  waste: "Waste Management",
  public_safety: "Public Safety",
  technology: "Technology",
  other: "Other",
};

// ========================================
// SUBMIT PROBLEM
// ========================================

const SubmitProblem = () => {
  // ========================================
  // FORM DATA
  // ========================================

  const [formData, setFormData] = useState(initialFormData);

  // ========================================
  // IMAGES
  // ========================================

  const [images, setImages] = useState([]);

  const [video, setVideo] = useState(null);

  const [documents, setDocuments] = useState([]);

  // ========================================
  // MESSAGE
  // ========================================

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  // ========================================
  // LOADING
  // ========================================

  const [loading, setLoading] = useState(false);

  // ========================================
  // AI CATEGORY
  // ========================================

  const [aiLoading, setAiLoading] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState("");

  const [aiSuggestionLevel, setAiSuggestionLevel] = useState("");

  // ========================================
  // MANUAL CATEGORY OVERRIDE
  // ========================================

  const manualCategoryChange = useRef(false);

  // ========================================
  // AI REQUEST TRACKING
  // ========================================

  const aiRequestId = useRef(0);

  // ========================================
  // AI CATEGORY PREDICTION
  // ========================================

  // ========================================
  // AI CATEGORY PREDICTION
  // ========================================

  useEffect(() => {
    const title = formData.title.trim();

    const description = formData.description.trim();

    // ========================================
    // DON'T CALL AI TOO EARLY
    // ========================================

    if (title.length < 5 || description.length < 15) {
      setAiSuggestion("");
      setAiSuggestionLevel("");
      setAiLoading(false);

      return;
    }

    // ========================================
    // CREATE NEW REQUEST ID
    // ========================================

    const requestId = ++aiRequestId.current;

    // ========================================
    // WAIT BEFORE API REQUEST
    // ========================================

    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          return;
        }

        setAiLoading(true);

        // ========================================
        // CALL AI
        // ========================================

        const result = await predictCategory(title, description, token);

        // ========================================
        // IGNORE OLD AI RESPONSE
        // ========================================

        if (requestId !== aiRequestId.current) {
          return;
        }

        console.log("AI Category Result:", result);

        // ========================================
        // GET AI CATEGORY
        // ========================================

        const aiCategory = result.category;

        const formCategory = aiCategoryMap[aiCategory];

        // ========================================
        // SAVE AI SUGGESTION
        // ========================================

        setAiSuggestion(aiCategory || "");

        setAiSuggestionLevel(result.suggestionLevel || "");

        // ========================================
        // AUTO SELECT CATEGORY
        // ========================================
        // Only when the AI is reasonably sure. On "uncertain" the card
        // still shows the guess, but the dropdown is left alone so the
        // citizen makes the call — silently selecting a low-confidence
        // category is how a wrong one ends up submitted unnoticed.

        const confident = result.suggestionLevel !== "uncertain";

        if (formCategory && confident && !manualCategoryChange.current) {
          setFormData((currentData) => ({
            ...currentData,

            category: formCategory,
          }));
        }
      } catch (error) {
        console.error("AI category prediction error:", error);

        // ========================================
        // ONLY CLEAR CURRENT REQUEST
        // ========================================

        if (requestId === aiRequestId.current) {
          setAiSuggestion("");
          setAiSuggestionLevel("");
        }
      } finally {
        if (requestId === aiRequestId.current) {
          setAiLoading(false);
        }
      }
    }, 700);

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      clearTimeout(timer);
    };
  }, [formData.title, formData.description]);
  // ========================================
  // HANDLE NORMAL INPUTS
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ========================================
    // CATEGORY MANUAL OVERRIDE
    // ========================================

    if (name === "category") {
      manualCategoryChange.current = true;
    }

    setFormData((currentData) => ({
      ...currentData,

      [name]: value,
    }));
  };

  // ========================================
  // HANDLE LOCATION
  // ========================================

  const handleLocationChange = (locationData) => {
    setFormData((currentData) => ({
      ...currentData,

      location: locationData.address || "",

      locationDetails: {
        district: locationData.district || "",

        state: locationData.state || "Jharkhand",

        pincode: locationData.pincode || "",

        latitude: locationData.latitude ?? null,

        longitude: locationData.longitude ?? null,
      },
    }));
  };

  // ========================================
  // HANDLE IMAGE SELECTION
  // ========================================

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    // ========================================
    // MAX 3 IMAGES
    // ========================================

    if (images.length + selectedFiles.length > 3) {
      setMessage("You can upload a maximum of 3 images.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    // ========================================
    // CHECK IMAGE TYPE
    // ========================================

    const invalidType = selectedFiles.find(
      (file) => !file.type.startsWith("image/"),
    );

    if (invalidType) {
      setMessage("Only image files are allowed.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    // ========================================
    // CHECK FILE SIZE
    // ========================================

    const invalidFile = selectedFiles.find(
      (file) => file.size > 5 * 1024 * 1024,
    );

    if (invalidFile) {
      setMessage("Each image must be smaller than 5 MB.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    // ========================================
    // ADD IMAGES
    // ========================================

    setImages((currentImages) => [...currentImages, ...selectedFiles]);

    setMessage("");

    setMessageType("");

    // ========================================
    // RESET FILE INPUT
    // ========================================

    e.target.value = "";
  };

  // ========================================
  // REMOVE IMAGE
  // ========================================

  const removeImage = (index) => {
    setImages((currentImages) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  // ========================================
  // HANDLE VIDEO SELECTION
  // ========================================
  // One short clip per problem, max 50 MB.

  const handleVideoChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("video/")) {
      setMessage("Only video files are allowed.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setMessage("Video must be smaller than 50 MB.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    setVideo(selectedFile);

    setMessage("");

    setMessageType("");

    e.target.value = "";
  };

  // ========================================
  // REMOVE VIDEO
  // ========================================

  const removeVideo = () => {
    setVideo(null);
  };

  // ========================================
  // HANDLE DOCUMENT SELECTION
  // ========================================
  // Up to 3 supporting documents (PDF / Word / text), 10 MB each.

  const DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  const handleDocumentChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    if (documents.length + selectedFiles.length > 3) {
      setMessage("You can attach a maximum of 3 documents.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    const invalidType = selectedFiles.find(
      (file) => !DOCUMENT_TYPES.includes(file.type),
    );

    if (invalidType) {
      setMessage("Only PDF, Word or text documents are allowed.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    const invalidFile = selectedFiles.find(
      (file) => file.size > 10 * 1024 * 1024,
    );

    if (invalidFile) {
      setMessage("Each document must be smaller than 10 MB.");

      setMessageType("error");

      e.target.value = "";

      return;
    }

    setDocuments((currentDocuments) => [...currentDocuments, ...selectedFiles]);

    setMessage("");

    setMessageType("");

    e.target.value = "";
  };

  // ========================================
  // REMOVE DOCUMENT
  // ========================================

  const removeDocument = (index) => {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((_, documentIndex) => documentIndex !== index),
    );
  };

  // ========================================
  // SUBMIT PROBLEM
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ========================================
    // START LOADING
    // ========================================

    setLoading(true);

    setMessage("");

    setMessageType("");

    try {
      // ========================================
      // GET TOKEN
      // ========================================

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login before submitting a problem.");

        setMessageType("error");

        return;
      }

      // ========================================
      // CHECK LOCATION
      // ========================================

      const { latitude, longitude } = formData.locationDetails;

      if (latitude === null || longitude === null) {
        setMessage("Please select a location on the map.");

        setMessageType("error");

        return;
      }

      // ========================================
      // CHECK CATEGORY
      // ========================================

      if (!formData.category) {
        setMessage("Please select a category.");

        setMessageType("error");

        return;
      }

      // ========================================
      // CREATE FORMDATA
      // ========================================

      const data = new FormData();

      // ========================================
      // BASIC INFORMATION
      // ========================================

      data.append("title", formData.title.trim());

      data.append("description", formData.description.trim());

      data.append("category", formData.category);

      data.append("location", formData.location.trim());

      // ========================================
      // LOCATION DETAILS
      // ========================================

      data.append("locationDetails", JSON.stringify(formData.locationDetails));

      // ========================================
      // IMPACT
      // ========================================

      data.append(
        "affectedPeople",
        String(Number(formData.affectedPeople) || 0),
      );

      data.append("severity", formData.severity);

      // ========================================
      // ADD IMAGES
      // ========================================

      images.forEach((image) => {
        data.append("images", image);
      });

      // ========================================
      // ADD VIDEO
      // ========================================

      if (video) {
        data.append("videos", video);
      }

      // ========================================
      // ADD DOCUMENTS
      // ========================================

      documents.forEach((document) => {
        data.append("documents", document);
      });

      // ========================================
      // SEND TO BACKEND
      // ========================================

      const response = await createProblem(data, token);

      // ========================================
      // SUCCESS
      // ========================================

      setMessage(response.message || "Problem submitted successfully.");

      setMessageType("success");

      // ========================================
      // CLEAR FORM
      // ========================================

      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",

        locationDetails: {
          district: "",
          state: "Jharkhand",
          pincode: "",
          latitude: null,
          longitude: null,
        },

        affectedPeople: "",
        severity: "medium",
      });

      // ========================================
      // CLEAR AI
      // ========================================

      setAiSuggestion("");
      setAiSuggestionLevel("");

      // ========================================
      // RESET MANUAL OVERRIDE
      // ========================================

      manualCategoryChange.current = false;

      // ========================================
      // CLEAR IMAGES
      // ========================================

      setImages([]);

      // ========================================
      // CLEAR VIDEO + DOCUMENTS
      // ========================================

      setVideo(null);

      setDocuments([]);
    } catch (error) {
      console.error("Submit problem error:", error);

      setMessage(error.response?.data?.message || "Failed to submit problem.");

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AI SUGGESTION MESSAGE
  // ========================================

  const renderAISuggestion = () => {
    if (aiLoading) {
      return (
        <div className="mt-3 rounded-xl border border-[#cfe4dc] bg-[#e9f4f0] p-4">
          <div className="flex items-center gap-3">
            <span className="animate-pulse text-xl">🤖</span>

            <div>
              <p className="font-semibold text-[#0a4f47]">
                AI is analyzing your problem...
              </p>

              <p className="mt-1 text-sm text-[#0b6b60]">
                Finding the most relevant category.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!aiSuggestion) {
      return null;
    }

    // The service reports how much to trust the guess. On "uncertain" the
    // dropdown was deliberately not auto-filled, so say so plainly instead
    // of presenting the guess as if it were settled.
    const unsure = aiSuggestionLevel === "uncertain";

    return (
      <div
        className={
          unsure
            ? "mt-3 rounded-xl border border-[#ecd9b8] bg-[#faf3e3] p-4"
            : "mt-3 rounded-xl border border-[#cfe4dc] bg-[#e9f4f0] p-4"
        }
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">🤖</span>

          <div className="flex-1">
            <p className="font-semibold text-[#173d3a]">
              {unsure ? "AI is not sure — closest guess:" : "AI suggests:"}

              <span
                className={
                  unsure ? "ml-1 text-[#a25a1b]" : "ml-1 text-[#0b6b60]"
                }
              >
                {aiSuggestion}
              </span>
            </p>

            {unsure ? (
              <p className="mt-1 text-sm text-[#5c6f69]">
                Please choose the category yourself, or add a little more
                detail to the description so the AI can do better.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-[#71827c]">
                  This suggestion is based on your title and description.
                  {aiSuggestionLevel === "moderate"
                    ? " It was a close call between a few categories."
                    : ""}
                </p>

                <p className="mt-1 text-sm text-[#71827c]">
                  You can change the category if you think another category is
                  more appropriate.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen bg-[#f7f8f5] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* ========================================
            PAGE HEADING
        ======================================== */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#173d3a]">
            Submit a Problem
          </h1>

          <p className="mt-2 text-[#71827c]">
            Tell us about a challenge in your community.
          </p>
        </div>

        {/* ========================================
            FORM CARD
        ======================================== */}

        <div className="rounded-2xl border border-[#e3e9e3] bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ========================================
                TITLE
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Problem Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: Flooding near village roads"
                required
                className="w-full rounded-lg border border-[#dbe5df] px-4 py-3 outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              />
            </div>

            {/* ========================================
                DESCRIPTION
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the problem in detail..."
                rows="5"
                required
                className="w-full resize-none rounded-lg border border-[#dbe5df] px-4 py-3 outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              />
            </div>

            {/* ========================================
                CATEGORY
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Category
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#dbe5df] bg-white px-4 py-3 outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              >
                <option value="">Select a category</option>

                <option value="agriculture">Agriculture</option>

                <option value="healthcare">Healthcare</option>

                <option value="education">Education</option>

                <option value="water">Water Management</option>

                <option value="environment">Environment</option>

                <option value="transportation">Transportation</option>

                <option value="energy">Energy</option>

                <option value="waste">Waste Management</option>

                <option value="public_safety">Public Safety</option>

                <option value="technology">Technology</option>

                <option value="other">Other</option>
              </select>

              {/* ========================================
                  AI SUGGESTION
              ======================================== */}

              {renderAISuggestion()}
            </div>

            {/* ========================================
                LOCATION
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Problem Location
              </label>

              <LocationPicker
                value={{
                  address: formData.location,

                  district: formData.locationDetails.district,

                  state: formData.locationDetails.state,

                  pincode: formData.locationDetails.pincode,

                  latitude: formData.locationDetails.latitude,

                  longitude: formData.locationDetails.longitude,
                }}
                onChange={handleLocationChange}
              />
            </div>

            {/* ========================================
                PROBLEM PHOTOS
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Problem Photos
              </label>

              <p className="mb-3 text-sm text-[#71827c]">
                Add up to 3 photos showing the problem. Each photo must be under
                5 MB.
              </p>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleImageChange}
                disabled={loading || images.length >= 3}
                className="block w-full cursor-pointer rounded-lg border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#5c6f69] file:mr-4 file:rounded-md file:border-0 file:bg-[#e9f4f0] file:px-4 file:py-2 file:font-semibold file:text-[#087f70] hover:file:bg-[#d8ebe4]"
              />

              {/* ========================================
                  IMAGE COUNT
              ======================================== */}

              <p className="mt-2 text-xs text-[#71827c]">
                {images.length}/3 photos selected
              </p>

              {/* ========================================
                  IMAGE PREVIEWS
              ======================================== */}

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {images.map((image, index) => {
                    const previewUrl = URL.createObjectURL(image);

                    return (
                      <div
                        key={`${image.name}-${image.lastModified}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-[#e3e9e3] bg-[#f2f5f1]"
                      >
                        <img
                          src={previewUrl}
                          alt={`Problem photo ${index + 1}`}
                          className="h-40 w-full object-cover"
                        />

                        {/* REMOVE BUTTON */}

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={loading}
                          className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                        >
                          ✕
                        </button>

                        <p className="truncate px-2 py-2 text-xs text-[#5c6f69]">
                          {image.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========================================
                PROBLEM VIDEO
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Problem Video (optional)
              </label>

              <p className="mb-3 text-sm text-[#71827c]">
                Attach one short clip showing the problem. Max 50 MB.
              </p>

              {!video ? (
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={handleVideoChange}
                  disabled={loading}
                  className="block w-full cursor-pointer rounded-lg border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#5c6f69] file:mr-4 file:rounded-md file:border-0 file:bg-[#e9f4f0] file:px-4 file:py-2 file:font-semibold file:text-[#087f70] hover:file:bg-[#d8ebe4]"
                />
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-[#e3e9e3] bg-[#f7f8f5] px-4 py-3">
                  <p className="truncate text-sm text-[#315d56]">
                    🎥 {video.name}
                  </p>

                  <button
                    type="button"
                    onClick={removeVideo}
                    disabled={loading}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* ========================================
                SUPPORTING DOCUMENTS
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Supporting Documents (optional)
              </label>

              <p className="mb-3 text-sm text-[#71827c]">
                Attach up to 3 documents (PDF, Word or text). Each must be
                under 10 MB.
              </p>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                multiple
                onChange={handleDocumentChange}
                disabled={loading || documents.length >= 3}
                className="block w-full cursor-pointer rounded-lg border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#5c6f69] file:mr-4 file:rounded-md file:border-0 file:bg-[#e9f4f0] file:px-4 file:py-2 file:font-semibold file:text-[#087f70] hover:file:bg-[#d8ebe4]"
              />

              <p className="mt-2 text-xs text-[#71827c]">
                {documents.length}/3 documents selected
              </p>

              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documents.map((document, index) => (
                    <div
                      key={`${document.name}-${document.lastModified}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#e3e9e3] bg-[#f7f8f5] px-4 py-2.5"
                    >
                      <p className="truncate text-sm text-[#315d56]">
                        📄 {document.name}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        disabled={loading}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========================================
                PEOPLE AFFECTED
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Approx. People Affected
              </label>

              <input
                type="number"
                name="affectedPeople"
                value={formData.affectedPeople}
                onChange={handleChange}
                min="0"
                placeholder="Example: 5000"
                required
                className="w-full rounded-lg border border-[#dbe5df] px-4 py-3 outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              />

              <p className="mt-2 text-xs text-[#71827c]">
                This helps the government prioritize high-impact problems.
              </p>
            </div>

            {/* ========================================
                SEVERITY
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Problem Severity
              </label>

              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#dbe5df] bg-white px-4 py-3 outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              >
                <option value="low">Low</option>

                <option value="medium">Medium</option>

                <option value="high">High</option>

                <option value="critical">Critical</option>
              </select>
            </div>

            {/* ========================================
                SUBMIT BUTTON
            ======================================== */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#0b514a] px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#073f3a] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Uploading Media &amp; AI Analyzing...</span>
                </>
              ) : (
                "Submit Problem"
              )}
            </button>
          </form>

          {/* ========================================
              MESSAGE
          ======================================== */}

          {message && (
            <div
              className={`mt-6 rounded-lg p-4 text-center font-medium ${
                messageType === "success"
                  ? "bg-[#e9f4f0] text-[#087f70]"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitProblem;
