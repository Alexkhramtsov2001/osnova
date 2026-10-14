import { type Project } from "../features/projects/catalog";
import { getProjectAdvantages, getProjectValueContext } from "../features/projects/estimates";

export default function ProjectPitch({
  project,
  selection,
}: {
  project: Project;
  selection: readonly Project[];
}) {
  const valueContext = getProjectValueContext(project, selection);
  return (
    <div className="project-pitch">
      <span className="comparison-concept-label">ХАРАКТЕР ПРОЕКТА</span>
      <h4>{project.positioning.headline}</h4>
      <p>{project.positioning.story}</p>
      <ul className="comparison-benefits">
        {project.positioning.benefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
      {selection.length > 1 && (
        <div className="comparison-selection-note">
          <strong>На фоне выбранных домов</strong>
          <ul className="comparison-benefits">
            {getProjectAdvantages(project, selection).map((advantage) => (
              <li key={advantage}>{advantage}</li>
            ))}
          </ul>
        </div>
      )}
      {valueContext && <p className="comparison-value-context">{valueContext}</p>}
    </div>
  );
}
