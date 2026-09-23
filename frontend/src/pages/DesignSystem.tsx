import { useApp } from "../state/AppContext";
import {
  Badge,
  Button,
  Card,
  EnergyChart,
  EnergyLevelIndicator,
  Field,
  Notice,
  PageHeader,
  ProgressBar,
} from "../components/ui";
export function DesignSystem() {
  const { notify, openModal } = useApp();
  const sample = () => notify("Interação concluída com sucesso.");
  return (
    <>
      <PageHeader
        title="Design System"
        subtitle="Componentes, cores e estados da experiência."
      />
      <div className="grid four">
        {[
          ["Índigo", "#363d92"],
          ["Roxo", "#5746c6"],
          ["Lilás", "#b19bd6"],
          ["Rosa", "#d49ac5"],
        ].map(([name, color]) => (
          <Card key={name}>
            <div className="color-swatch" style={{ background: color }} />
            {name}
            <p className="muted small">{color}</p>
          </Card>
        ))}
      </div>
      <div className="grid two" style={{ marginTop: 22 }}>
        <Card className="stack">
          <h2>Botões e estados</h2>
          <Button onClick={sample}>Primário</Button>
          <Button variant="secondary" onClick={sample}>
            Secundário
          </Button>
          <Button variant="outline" onClick={sample}>
            Outline
          </Button>
          <Button variant="danger" onClick={sample}>
            Danger
          </Button>
          <Button disabled icon={false}>
            Desabilitado
          </Button>
          <Button disabled icon={false}>
            ◌ Carregando
          </Button>
          <Badge success>✓ Sucesso</Badge>
          <span className="form-error">Erro · Confira os dados</span>
          <p className="small muted">
            Hover e pressed: passe o cursor e clique nos botões.
          </p>
        </Card>
        <Card className="stack">
          <h2>Formulários e feedback</h2>
          <Field label="Input">
            <input placeholder="Digite aqui" />
          </Field>
          <Field label="Select">
            <select>
              <option>Médio</option>
              <option>Baixo</option>
              <option>Alto</option>
            </select>
          </Field>
          <label className="check">
            <input type="checkbox" />
            Checkbox
          </label>
          <label className="check">
            <input type="radio" name="design-system" defaultChecked />
            Radio button
          </label>
          <label className="check">
            <input type="radio" name="design-system" />
            Outra opção
          </label>
          <Button variant="outline" onClick={() => openModal("sample")}>
            Abrir modal
          </Button>
          <Button variant="outline" onClick={sample}>
            Mostrar toast
          </Button>
          <ProgressBar value={50} />
        </Card>
        <Card className="stack">
          <h2>Energy Level Indicator</h2>
          <EnergyLevelIndicator value={55} />
          <EnergyLevelIndicator value={55} circular />
        </Card>
        <Card>
          <h2>Gráficos</h2>
          <EnergyChart value={55} />
        </Card>
      </div>
      <div style={{ marginTop: 22 }}>
        <Notice>
          Cards, tabs, sidebar, bottom navigation, player e componentes de
          protocolo e atendimento podem ser explorados nas respectivas telas.
        </Notice>
      </div>
    </>
  );
}
