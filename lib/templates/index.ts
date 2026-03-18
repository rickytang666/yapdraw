import type { DiagramTemplate } from '@/types/library'
import blankData from './blank.json'
import simpleFlowchartData from './simple-flowchart.json'
import microservicesData from './microservices.json'
import userAuthData from './user-auth.json'
import erDiagramData from './er-diagram.json'

const templates: DiagramTemplate[] = [
  blankData as DiagramTemplate,
  simpleFlowchartData as DiagramTemplate,
  microservicesData as DiagramTemplate,
  userAuthData as DiagramTemplate,
  erDiagramData as DiagramTemplate,
]

export function getAllTemplates(): DiagramTemplate[] {
  return templates
}

export function getTemplate(id: string): DiagramTemplate | undefined {
  return templates.find(t => t.id === id)
}

export function getTemplatesByCategory(
  category: DiagramTemplate['category']
): DiagramTemplate[] {
  return templates.filter(t => t.category === category)
}
