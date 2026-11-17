import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useCreateMembershipPlanMutation, useUpdateMembershipPlanMutation } from "../../Api/adminApi";
import toast from "react-hot-toast";

const EditMembershipModal = ({ isOpen, onClose, plan }) => {
  const [settings, setSettings] = useState({
    name: "",
    description: "",
    price: "",
    duration_days: "",
    yearly_price: "",
    is_active: true
  });

  const [createPlan] = useCreateMembershipPlanMutation();
  const [updatePlan] = useUpdateMembershipPlanMutation();

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        setSettings({
          name: plan.name || "",
          description: plan.description || "",
          price: plan.price || "",
          duration_days: plan.duration_days || "",
          yearly_price: plan.yearly_price || "",
          is_active: plan.is_active !== undefined ? plan.is_active : true
        });
      } else {
        setSettings({
          name: "Full Membership",
          description: "",
          price: "",
          duration_days: "",
          yearly_price: "",
          is_active: true
        });
      }
    }
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: settings.name,
        description: settings.description,
        price: parseFloat(settings.price) || 0,
        is_active: settings.is_active,
        duration_days: parseInt(settings.duration_days) || 0,
        // Empty means monthly only. The site hides the yearly option when this is null.
        yearly_price: settings.yearly_price === "" ? null : parseFloat(settings.yearly_price)
      };
      
      if (plan) {
        await updatePlan(payload).unwrap();
        toast.success("Membership plan updated successfully!");
      } else {
        await createPlan(payload).unwrap();
        toast.success("Membership plan created successfully!");
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to save membership plan.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-b from-[#7AA4A5] to-[#6A9495] border-b border-neutral-200 flex justify-between items-start shrink-0">
          <div className="flex flex-col gap-1 text-white">
            <h2 className="text-2xl font-bold arimo-font leading-8">
              {plan ? "Edit Membership Settings" : "Create Membership Plan"}
            </h2>
            <p className="text-white/90 text-base font-normal arimo-font">
              Configure your subscription plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[10px] hover:bg-white/20 transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-[5px]">
              <span className="text-neutral-700 text-sm font-normal arimo-font">
                Enable Membership
              </span>
              <span className="text-neutral-500 text-xs font-normal arimo-font">
                Allow students to subscribe to full access
              </span>
            </div>
            {/* You could add a real toggle input here if you wanted for is_active, but skipping per current UI design limitations/brevity unless needed */}
          </div>
          
          {/* Plan Name */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Plan Name
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal"
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Price ($)
            </label>
            <input
              type="number"
              value={settings.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal"
            />
          </div>

          {/* Yearly price */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Yearly Price ($)
            </label>
            <p className="text-xs text-neutral-500 -mt-1">
              Optional. Students pay this once a year if they pick the yearly option. Leave empty to offer monthly only.
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.yearly_price}
              onChange={(e) => handleChange("yearly_price", e.target.value)}
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal"
            />
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Duration (Days)
            </label>
            <input
              type="number"
              value={settings.duration_days}
              onChange={(e) => handleChange("duration_days", e.target.value)}
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2 grow">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Description 
            </label>
            <p className="text-xs text-neutral-500 mb-1">Provides details of what is included. You can use newlines.</p>
            <textarea
              value={settings.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal resize-y min-h-[140px]"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-[10px] border border-neutral-300 text-neutral-700 text-base font-normal arimo-font hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-greenTeal hover:bg-opacity-80 rounded-[10px] text-white text-base font-normal arimo-font shadow-sm flex items-center gap-2 transition-colors"
          >
            <Save size={18} />
            {plan ? "Update Settings" : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMembershipModal;
