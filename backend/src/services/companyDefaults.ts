export const DEFAULT_DEPARTMENTS = [
  { name: 'Executive', description: 'Company leadership and decision making' },
  { name: 'Sales', description: 'Revenue and customer acquisition' },
  { name: 'Marketing', description: 'Demand generation and brand' },
  { name: 'Finance', description: 'Financial planning and reporting' },
  { name: 'HR', description: 'People and talent operations' },
  { name: 'Operations', description: 'Execution and internal operations' },
]

export const DEFAULT_AGENTS = [
  {
    name: 'CEO Agent',
    slug: 'ceo',
    type: 'ceo',
    departmentName: 'Executive',
    description: 'Understands the whole company, answers questions, delegates work and coordinates agents.',
    systemPrompt: 'You are CompanyOS, the CEO-level company intelligence layer. Understand the whole company, answer questions, delegate work, and coordinate specialist agents.',
  },
  {
    name: 'Sales Agent',
    slug: 'sales',
    type: 'specialist',
    departmentName: 'Sales',
    description: 'Analyzes pipeline, customers, revenue and sales activity.',
    systemPrompt: 'You are the Sales specialist inside CompanyOS. Analyze pipeline, deal velocity, customer conversion, and sales performance.',
  },
  {
    name: 'Marketing Agent',
    slug: 'marketing',
    type: 'specialist',
    departmentName: 'Marketing',
    description: 'Analyzes campaigns, demand generation and marketing performance.',
    systemPrompt: 'You are the Marketing specialist inside CompanyOS. Analyze marketing campaigns, demand generation, and brand growth.',
  },
  {
    name: 'Finance Agent',
    slug: 'finance',
    type: 'specialist',
    departmentName: 'Finance',
    description: 'Analyzes financial data, budgets and business performance.',
    systemPrompt: 'You are the Finance specialist inside CompanyOS. Analyze financial health, budgets, cash flow, and costs.',
  },
  {
    name: 'HR Agent',
    slug: 'hr',
    type: 'specialist',
    departmentName: 'HR',
    description: 'Analyzes people, hiring and workforce operations.',
    systemPrompt: 'You are the HR specialist inside CompanyOS. Analyze hiring, team structure, and talent operations.',
  },
  {
    name: 'Operations Agent',
    slug: 'operations',
    type: 'specialist',
    departmentName: 'Operations',
    description: 'Analyzes processes, tasks, resources and operational bottlenecks.',
    systemPrompt: 'You are the Operations specialist inside CompanyOS. Analyze workflow execution, operational bottlenecks, and task completion.',
  },
]

export async function initializeCompanyDefaults(tx: any, companyId: string, userId?: string) {
  // 1. Upsert departments
  const departmentMap = new Map<string, string>()
  for (const dept of DEFAULT_DEPARTMENTS) {
    const createdDept = await tx.department.upsert({
      where: { companyId_name: { companyId, name: dept.name } },
      update: { description: dept.description },
      create: { companyId, name: dept.name, description: dept.description },
    })
    departmentMap.set(dept.name, createdDept.id)
  }

  // 2. Upsert agents
  const agentMap = new Map<string, any>()
  for (const agent of DEFAULT_AGENTS) {
    const departmentId = departmentMap.get(agent.departmentName)
    const createdAgent = await tx.agent.upsert({
      where: { companyId_slug: { companyId, slug: agent.slug } },
      update: {
        name: agent.name,
        type: agent.type,
        status: 'active',
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        departmentId,
      },
      create: {
        companyId,
        departmentId,
        name: agent.name,
        slug: agent.slug,
        type: agent.type,
        status: 'active',
        description: agent.description,
        systemPrompt: agent.systemPrompt,
      },
    })
    agentMap.set(agent.slug, createdAgent)
  }

  // 3. Initialize starter knowledge documents if none exist
  const existingDocs = await tx.document.count({ where: { companyId } })
  if (existingDocs === 0) {
    await tx.document.createMany({
      data: [
        {
          companyId,
          title: 'Company Overview & Operating Mission',
          sourceType: 'handbook',
          content: 'Our mission is to build the autonomous operating system for modern high-velocity companies. We prioritize customer obsession, rapid iterative execution, and radical operational transparency. All departments coordinate through dedicated AI agents overseen by the CEO intelligence orchestrator.',
          status: 'active',
        },
        {
          companyId,
          title: 'Product Roadmap & Commercial Strategy',
          sourceType: 'strategy',
          content: 'Q3 Focus: Expand enterprise intelligence integrations, automate departmental task routing, and deliver unified cross-functional analytics. Commercial model centers on multi-tier subscription plans with usage-based AI agent execution credits.',
          status: 'active',
        },
        {
          companyId,
          title: 'Financial & Hiring Policies',
          sourceType: 'policy',
          content: 'Target gross margins are 80%+. Department budgets are reviewed monthly by the Finance Agent. Hiring requires cross-functional alignment and an approved business case demonstrating measurable operational ROI.',
          status: 'active',
        },
      ],
    })
  }

  // 4. Initialize starter customers if none exist
  const existingCustomers = await tx.customer.count({ where: { companyId } })
  if (existingCustomers === 0) {
    await tx.customer.createMany({
      data: [
        { companyId, name: 'Acme Technologies', email: 'procurement@acme-tech.example.com', phone: '+1-555-0101' },
        { companyId, name: 'Starlight Dynamics', email: 'ops@starlight.example.com', phone: '+1-555-0102' },
        { companyId, name: 'Apex Global Enterprises', email: 'contact@apex-global.example.com', phone: '+1-555-0103' },
      ],
    })
  }

  // 5. Initialize starter tasks if user is provided and no tasks exist
  if (userId) {
    const existingTasks = await tx.task.count({ where: { companyId } })
    if (existingTasks === 0) {
      const salesAgent = agentMap.get('sales')
      const opsAgent = agentMap.get('operations')
      const financeAgent = agentMap.get('finance')
      const hrAgent = agentMap.get('hr')

      await tx.task.createMany({
        data: [
          {
            companyId,
            createdById: userId,
            agentId: salesAgent?.id,
            title: 'Q3 Enterprise Sales Pipeline Review',
            description: 'Evaluate open enterprise opportunities and accelerate customer deal closing.',
            priority: 'high',
            status: 'todo',
          },
          {
            companyId,
            createdById: userId,
            agentId: opsAgent?.id,
            title: 'Workflow Optimization & Bottleneck Audit',
            description: 'Analyze operational throughput across engineering and customer support handoffs.',
            priority: 'medium',
            status: 'in_progress',
          },
          {
            companyId,
            createdById: userId,
            agentId: financeAgent?.id,
            title: 'Monthly Burn Rate & Unit Economics Audit',
            description: 'Review departmental SaaS spend, cloud infrastructure costs, and gross margins.',
            priority: 'high',
            status: 'todo',
          },
          {
            companyId,
            createdById: userId,
            agentId: hrAgent?.id,
            title: 'Talent Acquisition & Headcount Planning',
            description: 'Finalize job descriptions for incoming engineering and product specialist hires.',
            priority: 'low',
            status: 'todo',
          },
        ],
      })
    }
  }

  return { departments: Array.from(departmentMap.entries()), agents: Array.from(agentMap.values()) }
}
