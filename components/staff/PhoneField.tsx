"use client";

import { useState } from "react";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { Country } from "react-phone-number-input";
import {
  isBlankPhone,
  isValidPhone,
  PHONE_REQUIRED_MESSAGE,
} from "@/lib/phone-format";

type CountryOption = {
  value?: Country | null | "ZZ";
  label: string;
  divider?: boolean;
};

function CountrySelectWithCallingCode({
  value,
  options,
  onChange,
  disabled,
  readOnly,
  iconComponent: Icon,
  ...rest
}: {
  value?: Country | null;
  options: CountryOption[];
  onChange: (country?: Country) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent?: React.ComponentType<{
    country: Country;
    label: string;
    "aria-hidden"?: boolean;
  }>;
  [key: string]: unknown;
}) {
  const optionsWithCode = options.map((opt) => {
    const val = opt.value;
    if (opt.divider || val === undefined || val === null || val === "ZZ") {
      return opt;
    }
    try {
      const code = getCountryCallingCode(val);
      return { ...opt, label: `${opt.label} +${code}` };
    } catch {
      return opt;
    }
  });
  const selectedOption = optionsWithCode.find((option) => {
    if (option.divider) {
      return false;
    }
    if (option.value === value) {
      return true;
    }
    if (value == null && (option.value == null || option.value === "ZZ")) {
      return true;
    }
    return false;
  });

  const selectProps = { ...rest };
  delete (selectProps as { readOnly?: boolean }).readOnly;

  return (
    <div className="PhoneInputCountry">
      <select
        {...selectProps}
        disabled={disabled || readOnly}
        value={value || "ZZ"}
        onChange={(event) =>
          onChange(
            event.target.value === "ZZ"
              ? undefined
              : (event.target.value as Country),
          )
        }
        className="PhoneInputCountrySelect"
      >
        {optionsWithCode.map((opt) => (
          <option
            key={opt.divider ? "|" : opt.value || "ZZ"}
            value={opt.divider ? "|" : opt.value || "ZZ"}
            disabled={!!opt.divider}
            style={
              opt.divider
                ? {
                    fontSize: "1px",
                    backgroundColor: "currentColor",
                    color: "inherit",
                  }
                : undefined
            }
          >
            {opt.label}
          </option>
        ))}
      </select>
      {Icon && selectedOption && !selectedOption.divider && value ? (
        <Icon aria-hidden country={value} label={selectedOption.label} />
      ) : null}
      <div className="PhoneInputCountrySelectArrow" />
    </div>
  );
}

function PhoneInputContainer({
  children,
  className,
  style,
  ...rest
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        width: "100%",
        minWidth: 0,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PhoneField({
  id,
  value,
  onChange,
  disabled,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const blank = isBlankPhone(value);
  const invalid = touched && (blank ? !!required : !isValidPhone(value));

  return (
    <div>
      <div
        className={`PhoneInputWrapper w-full min-w-0 rounded-lg border bg-amal-white focus-within:ring-2 ${
          invalid
            ? "border-amal-red/40 focus-within:ring-amal-red/20"
            : "border-black/15 focus-within:ring-amal-red/20"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <PhoneInput
          defaultCountry="PK"
          international
          limitMaxLength
          disabled={disabled}
          value={value || undefined}
          onChange={(next) => onChange(next ?? "")}
          onBlur={() => setTouched(true)}
          placeholder="300 0000000"
          className="flex! w-full! min-w-0! rounded-lg! border-0! p-0!"
          numberInputProps={{
            id,
            className:
              "w-full min-w-0! rounded-r-lg! border-0! bg-transparent px-3 py-2 text-sm focus:outline-none",
          }}
          countrySelectComponent={CountrySelectWithCallingCode}
          containerComponent={PhoneInputContainer}
        />
      </div>
      {invalid ? (
        <p className="mt-1 text-xs text-amal-red">
          {blank ? PHONE_REQUIRED_MESSAGE : "Enter a valid phone number."}
        </p>
      ) : null}
    </div>
  );
}
