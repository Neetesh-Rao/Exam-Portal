"use client";
import { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("My Company");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  const tabs = [
    {
      id: "company",
      label: "Company Profile",
      content: (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Company Information</h3>
          <div className="space-y-4 max-w-md">
            <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Input label="Company Website" placeholder="https://company.com" />
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl font-bold text-[var(--text-muted)]">
                  {companyName.charAt(0)}
                </div>
                <Button variant="secondary" size="sm">Upload Logo</Button>
              </div>
            </div>
            <div className="pt-4">
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: "team",
      label: "Team & Roles",
      content: (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Team Members</h3>
            <Button size="sm">+ Invite Member</Button>
          </div>
          <div className="space-y-3">
            {[
              { name: "Admin User", email: "admin@company.com", role: "admin" },
              { name: "HR Manager", email: "hr@company.com", role: "recruiter" },
              { name: "Tech Lead", email: "tech@company.com", role: "interviewer" },
            ].map((member, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-app-border dark:border-dark-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{member.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                  </div>
                </div>
                <Badge variant="accent">{member.role}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
    {
      id: "proctoring",
      label: "Proctoring Defaults",
      content: (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Default Proctoring Settings</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">These settings will be applied by default when creating new tests.</p>
          <div className="space-y-4 max-w-md">
            <Input label="Default Tab Switch Limit" type="number" defaultValue={3} />
            <div className="flex items-center justify-between p-3 border border-app-border dark:border-dark-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Full Screen Required</p>
                <p className="text-xs text-[var(--text-muted)]">Require fullscreen mode by default</p>
              </div>
              <div className="w-11 h-6 rounded-full bg-[var(--text-primary)] cursor-pointer">
                <div className="w-5 h-5 rounded-full bg-white dark:bg-app-text shadow-sm translate-x-5" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-app-border dark:border-dark-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Disable Copy/Paste</p>
                <p className="text-xs text-[var(--text-muted)]">Block clipboard operations by default</p>
              </div>
              <div className="w-11 h-6 rounded-full bg-[var(--text-primary)] cursor-pointer">
                <div className="w-5 h-5 rounded-full bg-white dark:bg-app-text shadow-sm translate-x-5" />
              </div>
            </div>
            <div className="pt-4">
              <Button onClick={handleSave} loading={saving}>Save Defaults</Button>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: "billing",
      label: "Plan & Billing",
      content: (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Current Plan</h3>
          <div className="p-4 border border-app-border dark:border-dark-border rounded-xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Free Plan</span>
              <Badge variant="neutral">Current</Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">Limited to 5 tests and 50 candidates per month</p>
            <div className="flex gap-2">
              <Button>Upgrade to Pro</Button>
              <Button variant="secondary">View Plans</Button>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Available Plans</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Free", price: "$0", features: ["5 tests/month", "50 candidates", "Basic proctoring"] },
              { name: "Pro", price: "$49", features: ["Unlimited tests", "500 candidates", "Advanced proctoring", "Priority support"] },
              { name: "Enterprise", price: "Custom", features: ["Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee"] },
            ].map((plan) => (
              <div key={plan.name} className="p-4 border border-app-border dark:border-dark-border rounded-xl">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mb-3">{plan.price}<span className="text-sm font-normal text-[var(--text-muted)]">/mo</span></p>
                <ul className="space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <span className="text-success">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Manage your account and preferences" />
      <div className="p-8 max-w-5xl mx-auto">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}
