"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, Zap } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

type ValidationRule = {
  type: "required" | "email" | "minLength" | "maxLength" | "pattern" | "custom";
  value?: any;
  message: string;
};

type ValidationRules = ValidationRule[];

interface ValidationState {
  isValid: boolean;
  isTouched: boolean;
  error: string | null;
}

interface UseFieldValidationReturn {
  value: string;
  setValue: (value: string) => void;
  error: string | null;
  isValid: boolean;
  isTouched: boolean;
  validate: () => boolean;
  reset: () => void;
  onBlur: () => void;
}

interface FieldConfig {
  name: string;
  rules: ValidationRules;
}

export function useFieldValidation(config: FieldConfig): UseFieldValidationReturn {
  const [value, setValue] = useState("");
  const [isTouched, setIsTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(() => {
    for (const rule of config.rules) {
      let isValid = true;

      switch (rule.type) {
        case "required":
          isValid = value.trim().length > 0;
          break;
        case "email":
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          break;
        case "minLength":
          isValid = value.length >= rule.value;
          break;
        case "maxLength":
          isValid = value.length <= rule.value;
          break;
        case "pattern":
          isValid = rule.value.test(value);
          break;
        case "custom":
          isValid = rule.value(value);
          break;
      }

      if (!isValid) {
        setError(rule.message);
        return false;
      }
    }

    setError(null);
    return true;
  }, [value, config.rules]);

  const onBlur = useCallback(() => {
    setIsTouched(true);
    validate();
  }, [validate]);

  const reset = useCallback(() => {
    setValue("");
    setIsTouched(false);
    setError(null);
  }, []);

  return {
    value,
    setValue,
    error,
    isValid: !error,
    isTouched,
    validate,
    reset,
    onBlur,
  };
}

// Form validation hook for entire form
interface FormValidationReturn {
  fields: Record<string, UseFieldValidationReturn>;
  isValid: boolean;
  isAnyTouched: boolean;
  validateAll: () => boolean;
  resetAll: () => void;
}

export function useFormValidation(fieldConfigs: Record<string, FieldConfig>): FormValidationReturn {
  const fields: Record<string, UseFieldValidationReturn> = {};
  
  for (const [name, config] of Object.entries(fieldConfigs)) {
    fields[name] = useFieldValidation(config);
  }

  const isValid = Object.values(fields).every((field) => field.isValid);
  const isAnyTouched = Object.values(fields).some((field) => field.isTouched);

  const validateAll = () => {
    return Object.values(fields).every((field) => field.validate());
  };

  const resetAll = () => {
    Object.values(fields).forEach((field) => field.reset());
  };

  return { fields, isValid, isAnyTouched, validateAll, resetAll };
}

// Inline Error Component
interface InlineErrorProps {
  error: string | null;
  icon?: boolean;
  className?: string;
}

export function InlineError({ error, icon = true, className = "" }: InlineErrorProps) {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-2 mt-2 animate-fade-in ${className}`}>
      {icon && (
        <AlertCircle size={16} strokeWidth={1.5} className="text-rose-400" />
      )}
      <p className="text-xs text-rose-400">{error}</p>
    </div>
  );
}

// Success Indicator Component
interface SuccessIndicatorProps {
  isValid: boolean;
  isTouched: boolean;
  showCheck?: boolean;
}

export function SuccessIndicator({ isValid, isTouched, showCheck = true }: SuccessIndicatorProps) {
  if (!isTouched || !isValid) return null;
  if (!showCheck) return null;

  return (
    <CheckCircle2 size={18} strokeWidth={1.5} className="text-emerald-400 animate-scale-in" />
  );
}

// Input Wrapper Component with validation UI
interface InputWrapperProps {
  children: ReactNode;
  label?: string;
  error?: string | null;
  isValid?: boolean;
  isTouched?: boolean;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function InputWrapper({
  children,
  label,
  error,
  isValid = false,
  isTouched = false,
  hint,
  required = false,
  className = "",
}: InputWrapperProps) {
  const hasError = isTouched && error;
  const showSuccess = isTouched && isValid;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-2">
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* Status Indicator */}
        {isTouched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError && (
              <AlertCircle size={18} strokeWidth={1.5} className="text-rose-400" />
            )}
            {showSuccess && (
              <CheckCircle2 size={18} strokeWidth={1.5} className="text-emerald-400" />
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      <InlineError error={error ?? null} />

      {/* Hint */}
      {hint && !error && (
        <p className="mt-2 text-xs text-white/40">{hint}</p>
      )}
    </div>
  );
}

// Character Counter Component
interface CharacterCounterProps {
  current: number;
  max: number;
  showLimit?: boolean;
  className?: string;
}

export function CharacterCounter({ current, max, showLimit = true, className = "" }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = current > max;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            isOverLimit ? "bg-rose-500" : isNearLimit ? "bg-amber-500" : "bg-white/30"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLimit && (
        <span className={isOverLimit ? "text-rose-400" : "text-white/40"}>
          {current}/{max}
        </span>
      )}
    </div>
  );
}

// Password Strength Indicator
interface PasswordStrengthProps {
  password: string;
  showFeedback?: boolean;
  className?: string;
}

interface StrengthLevel {
  score: number;
  label: string;
  color: string;
  width: string;
}

export function PasswordStrength({ password, showFeedback = true, className = "" }: PasswordStrengthProps) {
  const getStrength = (pwd: string): StrengthLevel => {
    let score = 0;
    
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { score, label: "Weak", color: "bg-rose-500", width: "20%" };
      case 2:
        return { score, label: "Fair", color: "bg-amber-500", width: "40%" };
      case 3:
        return { score, label: "Good", color: "bg-blue-500", width: "60%" };
      case 4:
      case 5:
        return { score, label: "Strong", color: "bg-emerald-500", width: "100%" };
      default:
        return { score: 0, label: "", color: "", width: "0%" };
    }
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className={className}>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
        <div 
          className={`h-full rounded-full transition-all ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>
      
      {showFeedback && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Password strength:</span>
          <span className={strength.score >= 3 ? "text-emerald-400" : strength.score >= 2 ? "text-amber-400" : "text-rose-400"}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}

// Common validation rules
export const validationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    type: "required",
    message,
  }),
  
  email: (message = "Please enter a valid email"): ValidationRule => ({
    type: "email",
    message,
  }),
  
  minLength: (length: number, message?: string): ValidationRule => ({
    type: "minLength",
    value: length,
    message: message || `Must be at least ${length} characters`,
  }),
  
  maxLength: (length: number, message?: string): ValidationRule => ({
    type: "maxLength",
    value: length,
    message: message || `Must be less than ${length} characters`,
  }),
  
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    type: "pattern",
    value: regex,
    message,
  }),
  
  custom: (validator: (value: string) => boolean, message: string): ValidationRule => ({
    type: "custom",
    value: validator,
    message,
  }),
};
