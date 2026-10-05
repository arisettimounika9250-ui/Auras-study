import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Using AuraStudy',
    paragraphs: [
      'AuraStudy provides study planning, focus tools, progress tracking, and AI-assisted learning features. You may use the service for your personal, lawful study activities.',
      'You must be old enough to use online services under the laws that apply to you. If you are under the age of majority where you live, use AuraStudy only with the involvement and permission of a parent or legal guardian.',
    ],
  },
  {
    title: '2. Your account',
    paragraphs: [
      'Provide accurate registration details and keep your password confidential. You are responsible for activity carried out through your account. Tell the service operator if you believe your account has been accessed without permission.',
      'Do not create accounts deceptively, impersonate another person, or use the service in a way that disrupts or attempts to gain unauthorized access to the service or its data.',
    ],
  },
  {
    title: '3. Your content and study data',
    paragraphs: [
      'You retain responsibility for the study materials, notes, prompts, and other content you submit. You confirm that you have the rights and permissions needed to submit that content.',
      'AuraStudy uses submitted information to provide the features you request, such as saving your study activity and generating assistant responses. Do not submit passwords, payment card details, or other sensitive information that is not needed for studying.',
    ],
  },
  {
    title: '4. AI-assisted features',
    paragraphs: [
      'AI-generated explanations, plans, and quiz questions may be incomplete, inaccurate, or unsuitable for your needs. Review them and verify important information using reliable sources.',
      'AI features are study aids, not professional advice, authoritative answers, or a substitute for your own judgment. Do not rely on them for high-stakes decisions.',
    ],
  },
  {
    title: '5. Acceptable use',
    paragraphs: [
      'Do not use AuraStudy to break the law, infringe another person’s rights, distribute harmful code, harass others, or interfere with the service. Do not attempt to reverse engineer, overload, or bypass security controls, except where applicable law permits.',
    ],
  },
  {
    title: '6. Availability and changes',
    paragraphs: [
      'The service is provided on an “as available” basis. Features may change, be interrupted, or be unavailable, including when maintenance or issues with external providers occur. Keep your own copy of any information you cannot afford to lose.',
      'The service operator may update these terms as the product changes. Updated terms will be posted on this page with a revised date. Continued use after an update means you accept the revised terms.',
    ],
  },
  {
    title: '7. Suspension and termination',
    paragraphs: [
      'You may stop using AuraStudy at any time. The service operator may suspend or end access if reasonably necessary to protect the service, its users, or comply with law. Where appropriate, notice will be provided.',
    ],
  },
  {
    title: '8. Disclaimers and liability',
    paragraphs: [
      'To the extent permitted by law, AuraStudy is provided without warranties that it will be uninterrupted, error-free, or suitable for a particular purpose. Nothing in these terms excludes rights or remedies that cannot legally be excluded.',
      'To the extent permitted by law, the service operator is not liable for indirect or consequential loss arising from use of the service. These terms do not limit liability that applicable law does not allow to be limited.',
    ],
  },
  {
    title: '9. Privacy',
    paragraphs: [
      'Your use of AuraStudy also involves the handling of account and study information to operate the service. Do not use the service if you do not agree with that use. A separate privacy notice should explain this handling in more detail when one is available.',
    ],
  },
  {
    title: '10. Contact',
    paragraphs: [
      'For questions about these terms, contact the AuraStudy service operator through the support channel provided with the service.',
    ],
  },
];

export default function Terms() {
  return (
    <main className="terms-page">
      <div className="terms-container">
        <Link to="/" className="text-link terms-back"><ArrowLeft size={15}/> Back to AuraStudy</Link>
        <header className="terms-header">
          <span className="eyebrow">AURASTUDY</span>
          <h1>Terms and Conditions</h1>
          <p>Last updated: October 3, 2026</p>
          <p className="terms-intro">These terms explain the basic rules for using AuraStudy. By creating an account or using the service, you agree to them. If you do not agree, do not use the service.</p>
        </header>
        <div className="terms-sections">
          {sections.map(section => (
            <section className="card terms-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
