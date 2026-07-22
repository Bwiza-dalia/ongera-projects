import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './ModulesLayout.css';

export function ModulesLayout() {
  const { pathname } = useLocation();
  const onVocabulary = pathname.startsWith('/modules/vocabulary');

  return (
    <div className="modules-layout">
      <nav className="modules-layout__tabs" aria-label="Modules section">
        <NavLink
          to="/modules"
          end
          className={() =>
            !onVocabulary
              ? 'modules-layout__tab modules-layout__tab--active'
              : 'modules-layout__tab'
          }
        >
          Modules
        </NavLink>
        <NavLink
          to="/modules/vocabulary"
          className={() =>
            onVocabulary
              ? 'modules-layout__tab modules-layout__tab--active'
              : 'modules-layout__tab'
          }
        >
          Vocabulary
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
