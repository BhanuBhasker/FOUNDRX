import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '🤝', title: 'Transparent matching', text: 'A clear, rule-based compatibility score — no black-box algorithms.' },
  { icon: '🧭', title: 'Skill-based discovery', text: 'Search and filter builders by skill, interest, experience, and availability.' },
  { icon: '🚀', title: 'Startup opportunities', text: 'Discover active startups looking for someone with exactly your skills.' },
  { icon: '📊', title: 'Team formation & milestones', text: 'Turn accepted collaborations into startups, projects, and milestones.' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col gap-24 py-8">
      <section className="text-center">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          DISCOVER BUILDERS · BUILD STARTUPS
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Find the right people. Build the right startup.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          FOUNDRX matches students, developers, designers, and operators into early-stage teams — using a transparent,
          explainable compatibility score.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {isAuthenticated ? (
            <Link to="/discover/builders" className="btn-primary px-6 py-3 text-base">Start discovering</Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary px-6 py-3 text-base">Create your profile</Link>
              <Link to="/login" className="btn-secondary px-6 py-3 text-base">Sign in</Link>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-brand-700">Dual Discovery</h2>
        <p className="mx-auto mt-1 max-w-xl text-center text-sm text-slate-500">
          FOUNDRX's main differentiator: discover people, and discover the startups looking for someone like you.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="card text-center">
            <div className="text-3xl">🧑‍💻</div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Find Builders</h3>
            <p className="mt-1 text-sm text-slate-500">
              "I have an idea. Who should I build with?" Browse compatible co-founders by skill, interest, and availability.
            </p>
            <Link to={isAuthenticated ? '/discover/builders' : '/register'} className="btn-secondary mt-4 inline-flex">
              Discover builders →
            </Link>
          </div>
          <div className="card text-center">
            <div className="text-3xl">🚀</div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Find Startup Opportunities</h3>
            <p className="mt-1 text-sm text-slate-500">
              "I have skills. Where can I contribute?" Browse active startups currently recruiting for their team.
            </p>
            <Link to={isAuthenticated ? '/discover/startups' : '/register'} className="btn-secondary mt-4 inline-flex">
              Discover startups →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="card text-center">
            <div className="text-3xl">{feature.icon}</div>
            <h3 className="mt-3 font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="card grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
        {[
          ['1', 'Create your profile', 'Add your skills, interests, experience, and startup goal.'],
          ['2', 'Discover matches', 'Search builders or startup opportunities, filtered and sorted.'],
          ['3', 'Connect or apply', 'Send a request, apply to join a startup, or accept an invitation.'],
          ['4', 'Build together', 'Form a team, add projects, and track milestones.'],
        ].map(([step, title, text]) => (
          <div key={step}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {step}
            </div>
            <h4 className="mt-3 font-semibold text-slate-900">{title}</h4>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
