"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

// Measurement validation schema with outlier detection
const measurementSchema = z.object({
  // Upper body
  chest: z.number().min(80).max(140),
  shoulder: z.number().min(35).max(60),
  sleeve: z.number().min(55).max(75),
  neck: z.number().min(32).max(50),
  jacketLength: z.number().min(65).max(90),
  
  // Lower body
  waist: z.number().min(60).max(120),
  hips: z.number().min(75).max(140),
  inseam: z.number().min(65).max(95),
  outseam: z.number().min(90).max(120),
  thigh: z.number().min(45).max(80),
  
  // Additional
  trouserRise: z.number().min(22).max(35),
  cuff: z.number().min(15).max(22),
  notes: z.string().optional(),
}).refine((data) => data.chest > data.waist, {
  message: "Chest measurement must be larger than waist",
  path: ["chest"],
});

type MeasurementData = z.infer<typeof measurementSchema>;

export default function NewMeasurementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<Partial<MeasurementData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`measurements-${id}`);
    if (saved) {
      try {
        setMeasurements(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved measurements");
      }
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`measurements-${id}`, JSON.stringify(measurements));
    }, 500);
    return () => clearTimeout(timer);
  }, [measurements, id]);

  const handleChange = (field: keyof MeasurementData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMeasurements((prev) => ({ ...prev, [field]: numValue }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const fieldsToValidate = {
      1: ["chest", "shoulder", "sleeve", "neck", "jacketLength"],
      2: ["waist", "hips", "inseam", "outseam", "thigh"],
      3: ["trouserRise", "cuff"],
    }[step] || [];

    const newErrors: Record<string, string> = {};
    
    fieldsToValidate.forEach((field) => {
      const value = measurements[field as keyof MeasurementData];
      if (!value || value === 0) {
        newErrors[field] = "This field is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        // Request presigned URL
        const res = await fetch("/api/files/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        });

        if (!res.ok) throw new Error("Failed to get upload URL");
        
        const { presignedUrl, publicUrl } = await res.json();

        // Upload to S3
        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        setPhotos((prev) => [...prev, publicUrl]);
        toast.success("Photo uploaded");
      } catch (error) {
        toast.error("Failed to upload photo");
      }
    }
  };

  const handleSubmit = async () => {
    // Final validation
    try {
      measurementSchema.parse(measurements);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Please check all measurements");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${id}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "native",
          payload: measurements,
          photos,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit measurements");

      localStorage.removeItem(`measurements-${id}`);
      toast.success("Measurements submitted successfully");
      router.push(`/work-orders/${id}`);
    } catch (error) {
      toast.error("Failed to submit measurements");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/work-orders/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Record Measurements
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Step {step} of 4 - All measurements in centimeters
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Upper Body Measurements</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: "chest", label: "Chest" },
                { field: "shoulder", label: "Shoulder Width" },
                { field: "sleeve", label: "Sleeve Length" },
                { field: "neck", label: "Neck" },
                { field: "jacketLength", label: "Jacket Length" },
              ].map(({ field, label }) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>
                    {label} (cm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={field}
                    type="number"
                    step="0.1"
                    value={measurements[field as keyof MeasurementData] || ""}
                    onChange={(e) => handleChange(field as keyof MeasurementData, e.target.value)}
                    className={errors[field] ? "border-red-500" : ""}
                  />
                  {errors[field] && (
                    <p className="text-xs text-red-600">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Lower Body Measurements</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: "waist", label: "Waist" },
                { field: "hips", label: "Hips" },
                { field: "inseam", label: "Inseam" },
                { field: "outseam", label: "Outseam" },
                { field: "thigh", label: "Thigh" },
              ].map(({ field, label }) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>
                    {label} (cm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={field}
                    type="number"
                    step="0.1"
                    value={measurements[field as keyof MeasurementData] || ""}
                    onChange={(e) => handleChange(field as keyof MeasurementData, e.target.value)}
                    className={errors[field] ? "border-red-500" : ""}
                  />
                  {errors[field] && (
                    <p className="text-xs text-red-600">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Additional Measurements</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: "trouserRise", label: "Trouser Rise" },
                { field: "cuff", label: "Cuff" },
              ].map(({ field, label }) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>
                    {label} (cm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={field}
                    type="number"
                    step="0.1"
                    value={measurements[field as keyof MeasurementData] || ""}
                    onChange={(e) => handleChange(field as keyof MeasurementData, e.target.value)}
                    className={errors[field] ? "border-red-500" : ""}
                  />
                  {errors[field] && (
                    <p className="text-xs text-red-600">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4">
              <Label htmlFor="notes">Additional Notes</Label>
              <textarea
                id="notes"
                value={measurements.notes || ""}
                onChange={(e) => setMeasurements((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Any special requirements or notes..."
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Upload Photos</h2>
            <p className="text-sm text-gray-600">
              Upload photos showing front, side, and back views
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700"
              >
                Click to upload photos
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-6 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Measurements"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
