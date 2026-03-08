import { useState, useEffect } from "react";
import { X, ArrowRight, ShieldCheck, Package, Plane, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action?: {
    label: string;
    href: string;
  };
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to CarryLink!",
    description: "You're now part of the world's most trusted peer-to-peer delivery network. Let's get you started with a quick tour.",
    icon: CheckCircle
  },
  {
    id: "kyc",
    title: "Verify Your Identity",
    description: "Complete KYC verification to unlock all features and build trust with other users. This is required for posting trips and higher transaction limits.",
    icon: ShieldCheck,
    action: {
      label: "Start KYC Verification",
      href: "/account/kyc"
    }
  },
  {
    id: "first-action",
    title: "What Would You Like to Do?",
    description: "Choose your first action to get started on CarryLink.",
    icon: Package
  }
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTutorial({ isOpen, onClose }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(4, 32, 48, 0.48)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md mx-4 p-8 relative"
        style={{
          boxShadow: "0 24px 64px rgba(4, 32, 48, 0.28)"
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f0faff] hover:bg-[#d8f4ff] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-[#2d7a96]" />
        </button>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index <= currentStep ? "bg-[#23bcf2]" : "bg-gray-200"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#d8f4ff] rounded-full flex items-center justify-center mx-auto mb-4">
            <step.icon className="w-8 h-8 text-[#23bcf2]" />
          </div>
          
          <h2 className="text-xl font-bold text-[#0d1a1f] mb-3">
            {step.title}
          </h2>
          
          <p className="text-sm text-[#2d7a96] leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step-specific content */}
        {step.id === "first-action" && (
          <div className="space-y-3 mb-6">
            <a
              href="/account/send-package"
              onClick={onClose}
              className="flex items-center gap-3 p-4 border border-[#b8eaf5] rounded-lg hover:border-[#23bcf2] hover:bg-[#f0faff] transition-colors group"
            >
              <div className="w-10 h-10 bg-[#23bcf2]/10 rounded-lg flex items-center justify-center group-hover:bg-[#23bcf2]/20">
                <Package className="w-5 h-5 text-[#23bcf2]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-[#0d1a1f] text-sm">Send a Package</div>
                <div className="text-xs text-[#2d7a96]">Find travelers to deliver your items</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#2d7a96] group-hover:text-[#23bcf2]" />
            </a>
            
            <a
              href="/account/post-trip"
              onClick={onClose}
              className="flex items-center gap-3 p-4 border border-[#b8eaf5] rounded-lg hover:border-[#23bcf2] hover:bg-[#f0faff] transition-colors group"
            >
              <div className="w-10 h-10 bg-[#23bcf2]/10 rounded-lg flex items-center justify-center group-hover:bg-[#23bcf2]/20">
                <Plane className="w-5 h-5 text-[#23bcf2]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-[#0d1a1f] text-sm">Post a Trip</div>
                <div className="text-xs text-[#2d7a96]">Earn money from your spare luggage space</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#2d7a96] group-hover:text-[#23bcf2]" />
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 border-[#b8eaf5] text-[#2d7a96] hover:border-[#23bcf2] hover:text-[#23bcf2]"
          >
            Skip Tour
          </Button>
          
          {step.action ? (
            <Button
              asChild
              className="flex-1 bg-[#23bcf2] hover:bg-[#1aa6d4] text-white"
            >
              <a href={step.action.href} onClick={onClose}>
                {step.action.label}
              </a>
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-[#23bcf2] hover:bg-[#1aa6d4] text-white"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}