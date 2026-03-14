import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface EditField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "email" | "url";
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: EditField[];
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export default function EditModal({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSave,
  onCancel,
  isLoading = false,
  saveLabel = "Save Changes",
  cancelLabel = "Cancel",
}: EditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none">
        <DialogHeader className="p-8 bg-carry-darker text-white">
          <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-gray-300">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[600px] overflow-y-auto">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted ml-1 block">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {field.type === "textarea" ? (
                <Textarea
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  className="min-h-[100px] border-gray-100 focus:border-carry-light resize-none"
                />
              ) : (
                <Input
                  type={field.type}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = field.type === "number" ? parseFloat(e.target.value) : e.target.value;
                    field.onChange(value);
                  }}
                  placeholder={field.placeholder}
                  className="border-gray-100 focus:border-carry-light"
                  min={field.min}
                  max={field.max}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            className="flex-1 font-bold uppercase tracking-widest text-xs h-12"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            disabled={isLoading}
            onClick={() => {
              onSave();
              onOpenChange(false);
            }}
            className="flex-1 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
              </>
            ) : (
              saveLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
