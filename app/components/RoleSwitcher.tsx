"use client";
import React from "react";

export type UserRole = "creator" | "manager" | "reviewer" | "admin";

export type RoleSwitcherProps = {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
};

export const ROLES: {
  id: UserRole;
  label: string;
  badge: string;
  description: string;
  permission: string;
}[] = [
  {
    id: "creator",
    label: "Content Creator",
    badge: "DRAFT & PRE-FLIGHT",
    description: "Runs instant self-serve pre-flight checks and applies 1-click intent-preserving rewrites.",
    permission: "Edit drafts • Run pre-flight audit • Apply suggestions",
  },
  {
    id: "manager",
    label: "Marketing Manager",
    badge: "COLLABORATION & DIFFS",
    description: "Inspects side-by-side revision diffs, resolves tone inconsistencies, and requests revisions.",
    permission: "Review diffs • Request revisions • Leave inline comments",
  },
  {
    id: "reviewer",
    label: "Authorized Reviewer",
    badge: "LEGAL & COMPLIANCE SIGN-OFF",
    description: "Evaluates atomic claim evidence, enters structured human override rationales, and signs approvals.",
    permission: "Deterministic source checks • Enter overrides • Sign approvals",
  },
  {
    id: "admin",
    label: "Brand Administrator",
    badge: "GOVERNANCE TELEMETRY",
    description: "Monitors guideline ambiguity, reviewer override rates, and tunes brand packs.",
    permission: "Edit brand packs • Review telemetry • Manage organization policies",
  },
];

export function RoleSwitcher({ activeRole, onRoleChange }: RoleSwitcherProps) {
  const current = ROLES.find((r) => r.id === activeRole) ?? ROLES[0];

  return (
    <div className="role-switcher-container">
      <div className="role-tabs-bar" role="tablist" aria-label="Simulate User Role">
        <span className="role-nav-label">ACTING ROLE:</span>
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            role="tab"
            aria-selected={activeRole === role.id}
            className={`role-tab-btn ${activeRole === role.id ? "active" : ""}`}
            onClick={() => onRoleChange(role.id)}
          >
            <span className="role-dot" />
            <span className="role-tab-text">{role.label}</span>
          </button>
        ))}
      </div>

      <div className="role-info-card">
        <div className="role-info-header">
          <span className="role-badge-tag">{current.badge}</span>
          <span className="role-permission-text">{current.permission}</span>
        </div>
        <p className="role-description-text">{current.description}</p>
      </div>
    </div>
  );
}

