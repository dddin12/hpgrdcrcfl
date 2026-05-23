import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileSearch, ArrowRight, AlertTriangle } from 'lucide-react';
import { listInvestigations } from '@/data/investigationStore';

const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const items = listInvestigations();

  return (
    <div className="space-y-6">
      <motion.div initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}}
        className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-card via-card to-muted/50 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Investigation Dashboard</h1>
            <p className="text-sm text-muted-foreground">HPGRDC Incident Investigation Reports</p>
          </div>
          <motion.div whileHover={{scale:1.03}} whileTap={{scale:.97}}>
            <Link to="/new-investigation"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New Investigation
            </Link>
          </motion.div>
        </div>
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      </motion.div>

      <motion.div variants={item} initial="hidden" animate="show" className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider">All Investigations</h2>
          <span className="text-xs text-muted-foreground">{items.length} total</span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileSearch className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">No investigations yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">Start a new HPGRDC Incident Investigation. Fill the investigation form, then generate the AI analysis.</p>
            <button onClick={() => navigate('/new-investigation')}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Start your first investigation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Lab Name</th>
                  <th className="px-4 py-3 font-medium">Incident Title</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Classification</th>
                  <th className="px-4 py-3 font-medium">Reported By</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(inv => (
                  <tr key={inv.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.dateOfIncident || '—'}</td>
                    <td className="px-4 py-3 text-xs">{inv.labName || '—'}</td>
                    <td className="px-4 py-3 font-medium">{inv.incidentTitle}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.location}</td>
                    <td className="px-4 py-3">
                      {inv.classification && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {inv.classification === 'NA' ? 'N/A' : inv.classification}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.reportedBy || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/investigation/${inv.id}`} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                        {inv.aiReport ? 'Open' : 'Edit Draft'} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {items.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3" />
          Reports are stored locally on this device. Clearing browser data will remove them.
        </p>
      )}
    </div>
  );
}
