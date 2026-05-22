import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, FileDown, Palette, Shield } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    criticalOnly: false,
    weeklyDigest: true,
  });
  const [reportDefaults, setReportDefaults] = useState({
    includeRiskMatrix: true,
    includeFishbone: true,
    includeCauseTree: true,
    autoIncludeSOPs: true,
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure application preferences</p>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div variants={item} className="glass-card">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Notification Preferences</h2>
        </div>
        <div className="space-y-4 p-5">
          {[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email notifications for new incidents' },
            { key: 'criticalOnly', label: 'Critical Only', desc: 'Only notify for critical and high severity incidents' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary of all investigations' },
          ].map((setting) => (
            <label key={setting.key} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">{setting.label}</p>
                <p className="text-xs text-muted-foreground">{setting.desc}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotifications(prev => ({ ...prev, [setting.key]: !prev[setting.key as keyof typeof prev] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${notifications[setting.key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted'}`}
              >
                <motion.div
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                  animate={{ left: notifications[setting.key as keyof typeof notifications] ? '22px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Report Defaults */}
      <motion.div variants={item} className="glass-card">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <FileDown className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Report Defaults</h2>
        </div>
        <div className="space-y-4 p-5">
          {[
          { key: 'includeRiskMatrix', label: 'Include WHY Tree', desc: 'Show WHY Tree Analysis in the report' },
            { key: 'includeFishbone', label: 'Include Key Factors', desc: 'Show Key Factors Identified section' },
            { key: 'includeCauseTree', label: 'Include Systems to Reinforce', desc: 'Show the fixed 13-system table' },
            { key: 'autoIncludeSOPs', label: 'Use uploaded SOPs for grounding', desc: 'Pass attached SOPs / manuals to AI as grounding context' },
          ].map((setting) => (
            <label key={setting.key} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">{setting.label}</p>
                <p className="text-xs text-muted-foreground">{setting.desc}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setReportDefaults(prev => ({ ...prev, [setting.key]: !prev[setting.key as keyof typeof prev] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${reportDefaults[setting.key as keyof typeof reportDefaults] ? 'bg-primary' : 'bg-muted'}`}
              >
                <motion.div
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                  animate={{ left: reportDefaults[setting.key as keyof typeof reportDefaults] ? '22px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </label>
          ))}
        </div>
      </motion.div>

      {/* About */}
      <motion.div variants={item} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">About</h2>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>HPGRDC Investigation System v1.0</p>
          <p>HP Green R&D Centre — Incident Investigation Reports</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
