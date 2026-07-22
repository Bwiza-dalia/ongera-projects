import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreateModuleModal,
  type CreateModuleForm,
} from '../components/catalog/CreateModuleModal';
import { useAuth } from '../context/AuthContext';
import {
  domainExerciseCount,
  THERAPY_DOMAINS,
  type TherapyDomainCatalog,
  type TherapyDomainId,
} from '../lib/therapyDomains';
import { createModule, getModuleCatalog } from '../services/catalogService';
import speechTherapyImg from '../assets/speechtherapy.png';
import cognitiveTherapyImg from '../assets/cognitivetherapy.png';
import motionTherapyImg from '../assets/motiontherapy.png';
import '../styles/admin-page.css';
import './CatalogPage.css';

const emptyModuleForm: CreateModuleForm = {
  name: '',
  description: '',
  domainId: 'speech',
};

const DOMAIN_IMAGES: Record<TherapyDomainId, { image: string; imageAlt: string }> = {
  speech: {
    image: speechTherapyImg,
    imageAlt: 'Speech therapy session with anatomical model',
  },
  cognitive: {
    image: cognitiveTherapyImg,
    imageAlt: 'Cognitive therapy session with note-taking',
  },
  motion: {
    image: motionTherapyImg,
    imageAlt: 'Motion therapy session measuring joint range',
  },
};

export function CatalogPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<TherapyDomainCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [moduleSubmitting, setModuleSubmitting] = useState(false);
  const [moduleFormError, setModuleFormError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setDomains(await getModuleCatalog(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openModuleModal(domainId?: TherapyDomainId) {
    setModuleFormError('');
    setModuleForm({
      ...emptyModuleForm,
      domainId: domainId ?? 'speech',
    });
    setModuleModalOpen(true);
  }

  function openDomain(domain: TherapyDomainCatalog) {
    const moduleId = domain.modules[0]?.id;
    if (!moduleId) {
      openModuleModal(domain.id);
      return;
    }
    navigate(`/modules/${moduleId}`);
  }

  async function handleCreateModule(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const domainMeta = THERAPY_DOMAINS.find((d) => d.id === moduleForm.domainId);
    if (!domainMeta) return;

    setModuleSubmitting(true);
    setModuleFormError('');
    setError('');
    setSuccess('');
    try {
      const created = await createModule(token, {
        name: moduleForm.name.trim(),
        description: moduleForm.description.trim() || undefined,
        type: domainMeta.apiType,
        module_type: domainMeta.apiType,
      });
      setSuccess('Module created.');
      setModuleModalOpen(false);
      setModuleForm(emptyModuleForm);
      await load();
      navigate(`/modules/${created.id}`);
    } catch (err) {
      setModuleFormError(err instanceof Error ? err.message : 'Failed to create module');
    } finally {
      setModuleSubmitting(false);
    }
  }

  return (
    <div className="admin-page catalog-page">
      <header className="catalog-page__hero">
        <h1>Modules</h1>
        <div className="catalog-page__actions">
          <button type="button" className="admin-page__cta" onClick={() => openModuleModal()}>
            + Create module
          </button>
        </div>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}{' '}
          <button type="button" className="admin-page__retry" onClick={() => load()}>
            Retry
          </button>
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      {loading ? (
        <p className="admin-page__empty">Loading modules…</p>
      ) : (
        <div className="catalog-page__grid">
          {domains.map((domain) => {
            const media = DOMAIN_IMAGES[domain.id];
            const exerciseCount = domainExerciseCount(domain);
            const available = exerciseCount > 0;

            return (
              <button
                key={domain.id}
                type="button"
                className="catalog-domain"
                onClick={() => openDomain(domain)}
                aria-label={`View details for ${domain.name}`}
              >
                <div className="catalog-domain__media">
                  <img src={media.image} alt={media.imageAlt} className="catalog-domain__img" />
                </div>

                <div className="catalog-domain__body">
                  <div className="catalog-domain__tags">
                    <span className={`catalog-domain__tag catalog-domain__tag--${domain.tone}`}>
                      {domain.category}
                    </span>
                    <span
                      className={
                        available
                          ? 'catalog-domain__tag catalog-domain__tag--status'
                          : 'catalog-domain__tag catalog-domain__tag--muted'
                      }
                    >
                      {available ? 'Available' : 'Coming soon'}
                    </span>
                  </div>

                  <h2 className="catalog-domain__title">{domain.name}</h2>
                  {domain.description ? (
                    <p className="catalog-domain__desc">{domain.description}</p>
                  ) : null}

                  <div className="catalog-domain__meta">
                    <span className="catalog-domain__pill">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
                        <path d="M10 10l5 3-5 3v-6z" fill="currentColor" />
                      </svg>
                      {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <span className="catalog-domain__cta">
                    View details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreateModuleModal
        open={moduleModalOpen}
        form={moduleForm}
        submitting={moduleSubmitting}
        error={moduleFormError}
        onClose={() => !moduleSubmitting && setModuleModalOpen(false)}
        onChange={(key, value) => setModuleForm((f) => ({ ...f, [key]: value }))}
        onSubmit={handleCreateModule}
      />
    </div>
  );
}
