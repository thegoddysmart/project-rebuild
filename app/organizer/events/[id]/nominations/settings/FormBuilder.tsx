"use client";

import { useState } from "react";
import {
  getEventNominationForm,
  upsertNominationField,
  deleteNominationField,
  upsertNominationForm,
} from "@/app/actions/nomination-form";
import type { NominationFieldType } from "@prisma/client";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  MoreVertical,
  GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";

interface FormBuilderProps {
  eventId: string;
  initialForm: any;
}

export default function FormBuilder({
  eventId,
  initialForm,
}: FormBuilderProps) {
  const [fields, setFields] = useState<any[]>(initialForm?.fields || []);
  const [isActive, setIsActive] = useState(initialForm?.isActive || false);
  const [whatsappLink, setWhatsappLink] = useState(
    initialForm?.whatsappLink || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Field State
  const [newField, setNewField] = useState({
    label: "",
    type: "TEXT" as NominationFieldType,
    required: false,
    options: "", // Comma sep for now
  });

  const fieldTypes: NominationFieldType[] = [
    "TEXT",
    "TEXTAREA",
    "NUMBER",
    "EMAIL",
    "PHONE",
    "SELECT",
    "MULTI_SELECT",
    "CHECKBOX",
    "FILE",
    "URL",
  ];

  const handleToggleActive = async () => {
    try {
      const newState = !isActive;
      setIsActive(newState);
      // Pass current whatsappLink to ensure consistency, though undefined is safe too.
      await upsertNominationForm(eventId, newState, whatsappLink);
      toast.success(`Nominations ${newState ? "Enabled" : "Disabled"}`);
    } catch (error) {
      toast.error("Failed to update status");
      setIsActive(!isActive); // Revert
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await upsertNominationForm(eventId, isActive, whatsappLink);
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // ... (rest of functions)

  const handleSaveField = async () => {
    if (!newField.label) {
      toast.error("Label is required");
      return;
    }

    setIsSaving(true);
    try {
      const key = editingField?.key || `field_${Date.now()}`;
      const optionsArray = newField.options
        ? newField.options.split(",").map((s: string) => s.trim())
        : [];

      await upsertNominationField({
        id: editingField?.id,
        formId: initialForm?.id, // Assumes form exists, might need to create if null
        key: key,
        label: newField.label,
        type: newField.type,
        required: newField.required,
        options: optionsArray.length > 0 ? optionsArray : undefined,
        order: editingField?.order || fields.length,
      });

      toast.success("Field saved");
      window.location.reload(); // Simple reload to refresh data
    } catch (error) {
      console.error(error);
      toast.error("Failed to save field");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this field?")) return;
    try {
      await deleteNominationField(id);
      setFields(fields.filter((f) => f.id !== id));
      toast.success("Field deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const openEdit = (field: any) => {
    setEditingField(field);
    setNewField({
      label: field.label,
      type: field.type,
      required: field.required,
      options: Array.isArray(field.options) ? field.options.join(", ") : "",
    });
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingField(null);
    setNewField({
      label: "",
      type: "TEXT",
      required: false,
      options: "",
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Form Configuration
            </h2>
            <p className="text-gray-500 text-sm">
              Manage nomination status and post-submission actions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isActive ? "Live" : "Disabled"}
            </span>
            <button
              onClick={handleToggleActive}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  isActive ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              WhatsApp Group Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Nominees will be invited to join this group after successful
              submission.
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 h-[42px]"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nomination Form</h2>
            <p className="text-gray-500 text-sm">
              Design the questions candidates must answer.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-bold ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isActive ? "Live" : "Disabled"}
            </span>
            <button
              onClick={handleToggleActive}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  isActive ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Default Fields (Read Only) */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            System Fields (Standard)
          </h3>
          <div className="space-y-2">
            {[
              "Full Name",
              "Email Address",
              "Phone Number",
              "Nominee Photo",
              "Bio",
            ].map((label) => (
              <div
                key={label}
                className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center opacity-70"
              >
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-xs font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded">
                  REQUIRED
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Fields */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Custom Fields
            </h3>
            <button
              onClick={openNew}
              className="text-sm text-magenta-600 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3">
                  <GripVertical
                    className="text-gray-300 cursor-grab"
                    size={20}
                  />
                  <div>
                    <p className="font-bold text-gray-800">{field.label}</p>
                    <p className="text-xs text-gray-500">
                      {field.type}{" "}
                      {field.required ? "• Required" : "• Optional"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(field)}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="p-2 text-gray-500 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400">No custom questions added.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-6">
                {editingField ? "Edit Question" : "Add Custom Question"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Question Label
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
                    value={newField.label}
                    onChange={(e) =>
                      setNewField({ ...newField, label: e.target.value })
                    }
                    placeholder="e.g. Years of Experience"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
                      value={newField.type}
                      onChange={(e) =>
                        setNewField({
                          ...newField,
                          type: e.target.value as NominationFieldType,
                        })
                      }
                    >
                      {fieldTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-magenta-600 rounded focus:ring-magenta-500"
                        checked={newField.required}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            required: e.target.checked,
                          })
                        }
                      />
                      <span className="font-medium text-gray-700">
                        Required?
                      </span>
                    </label>
                  </div>
                </div>

                {(newField.type === "SELECT" ||
                  newField.type === "MULTI_SELECT") && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Options (Comma separated)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
                      value={newField.options}
                      onChange={(e) =>
                        setNewField({ ...newField, options: e.target.value })
                      }
                      placeholder="Option A, Option B, Option C"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveField}
                  disabled={isSaving}
                  className="px-4 py-2 bg-magenta-600 text-white rounded-lg font-bold hover:bg-magenta-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Question"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
