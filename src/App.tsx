import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { ClassProvider, useClass } from './context/ClassContext';
import AdminDashboard from './views/AdminDashboard';
import StudentPortal from './views/StudentPortal';
import StudentEnrollmentPortal from './views/StudentEnrollmentPortal';
import ProjectorView from './views/ProjectorView';
import ToastContainer from './components/Toast';

const AppContent: React.FC = () => {
  const { isCloudSynced, activeClass, activeAdminProfile, classes } = useClass();
  const [routeParams, setRouteParams] = useState<{
    classId: string | null;
    studentId: string | null;
    enrollClassId: string | null;
    isProjector: boolean;
  }>({
    classId: null,
    studentId: null,
    enrollClassId: null,
    isProjector: false
  });

  // Client-side query-based routing (highly optimized for 100% static hosting compatibility)
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const classId = params.get('classId');
      const studentId = params.get('studentId');
      const enrollClassId = params.get('enrollClassId') || params.get('join');
      const isProjector = params.get('projector') === 'true' || params.get('present') === 'true';
      setRouteParams({ classId, studentId, enrollClassId, isProjector });
    };

    handleUrlChange();

    // Listen to history push events if any
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  if (routeParams.isProjector) {
    const matchedClass = routeParams.classId ? classes.find(c => c.id === routeParams.classId) : activeClass;
    return <ProjectorView classData={matchedClass || activeClass || classes[0]} isStandalone={true} />;
  }

  const isStudentPortal = routeParams.classId && routeParams.studentId;
  const isEnrollmentPortal = !!routeParams.enrollClassId;
  const enrollmentClass = isEnrollmentPortal ? classes.find(c => c.id === routeParams.enrollClassId) : null;

  return (
    <div className="app-container">
      {/* Dynamic Header */}
      <header className="app-header">
        <div className="brand" onClick={() => window.location.href = window.location.origin + window.location.pathname}>
          <img src="/PeerGrading.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          <span>PeerLens <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.1rem 0.45rem', borderRadius: '12px', border: '1px solid hsla(243, 75%, 59%, 0.2)' }}>v2.4</span></span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isEnrollmentPortal ? null : isStudentPortal ? (
            <span className="badge badge-teal" style={{ gap: '0.25rem' }}>
              <ShieldCheck size={12} /> Verified Session
            </span>
          ) : (
            <>
              {isCloudSynced ? (
                <span className="badge badge-teal" style={{ gap: '0.25rem' }}>
                  <Database size={12} /> Cloud Connected
                </span>
              ) : (
                <span className="badge badge-primary">
                  Offline Mode
                </span>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {isEnrollmentPortal ? (
          <StudentEnrollmentPortal classId={routeParams.enrollClassId!} />
        ) : isStudentPortal ? (
          <StudentPortal
            classId={routeParams.classId!}
            studentId={routeParams.studentId!}
          />
        ) : (
          <AdminDashboard />
        )}
      </main>

      {/* Dynamic Footer */}
      <footer className="app-footer">
        {/* Left: brand identity */}
        <div className="app-footer-brand">
          <img src="/PeerGrading.png" alt="PeerLens Logo" className="app-footer-logo" />
          <div className="app-footer-brand-text">
            <span className="app-footer-name">PeerLens</span>
            <span className="app-footer-tagline">Intelligent Peer Assessment, Simplified</span>
          </div>
        </div>

        {/* Centre: dynamic context */}
        <div className="app-footer-center">
          {isEnrollmentPortal ? (
            <span className="app-footer-context">
              <span className="app-footer-context-label">Enrolling into</span>
              <span className="app-footer-context-divider" />
              <span className="app-footer-context-value">{enrollmentClass?.name ?? routeParams.enrollClassId}</span>
            </span>
          ) : isStudentPortal ? (
            <span className="app-footer-context">
              <span className="app-footer-context-label">Viewing Class</span>
              <span className="app-footer-context-divider" />
              <span className="app-footer-context-value">{activeClass?.name ?? routeParams.classId}</span>
            </span>
          ) : activeClass ? (
            <span className="app-footer-context">
              <span className="app-footer-context-label">
                {activeAdminProfile === 'default' ? 'Default Workspace' : `Workspace: ${activeAdminProfile.charAt(0).toUpperCase()}${activeAdminProfile.slice(1)}`}
              </span>
              <span className="app-footer-context-divider" />
              <span className="app-footer-context-value">{activeClass.name}</span>
            </span>
          ) : (
            <span className="app-footer-context app-footer-context--muted">
              No classroom selected
            </span>
          )}
        </div>

        {/* Right: trust badges */}
        <div className="app-footer-badges">
          <span className="app-footer-badge">
            <svg width="11" height="11" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path fill="currentColor" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
            </svg>
            Double-Blind Anonymity
          </span>
          <span className="app-footer-divider" />
          <span className="app-footer-badge app-footer-badge--teal">
            <ShieldCheck size={11} />
            Secure &amp; Private
          </span>
          <span className="app-footer-divider" />
          <span className="app-footer-copy">© {new Date().getFullYear()} PeerLens</span>
        </div>
      </footer>

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ClassProvider>
      <AppContent />
    </ClassProvider>
  );
};

export default App;
