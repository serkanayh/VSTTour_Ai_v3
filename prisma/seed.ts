import { PrismaClient, UserRole, ProcessStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Departments
  const itDepartment = await prisma.department.upsert({
    where: { name: 'Information Technology' },
    update: {},
    create: {
      name: 'Information Technology',
      description: 'IT and software development team',
    },
  });

  const accountingDepartment = await prisma.department.upsert({
    where: { name: 'Accounting' },
    update: {},
    create: {
      name: 'Accounting',
      description: 'Financial accounting and reporting',
    },
  });

  console.log('✅ Departments created');

  // Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vsttour.com' },
    update: {},
    create: {
      email: 'admin@vsttour.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@vsttour.com' },
    update: {},
    create: {
      email: 'manager@vsttour.com',
      name: 'Manager User',
      password: managerPassword,
      role: UserRole.MANAGER,
      departmentId: accountingDepartment.id,
      isActive: true,
    },
  });

  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'ayse.yilmaz@vsttour.com' },
    update: {},
    create: {
      email: 'ayse.yilmaz@vsttour.com',
      name: 'Ayşe Yılmaz',
      password: userPassword,
      role: UserRole.USER,
      departmentId: accountingDepartment.id,
      isActive: true,
    },
  });

  console.log('✅ Users created');
  console.log('   Admin: admin@vsttour.com / admin123');
  console.log('   Manager: manager@vsttour.com / manager123');
  console.log('   User: ayse.yilmaz@vsttour.com / user123');

  // Create AI Configuration
  const aiConfig = await prisma.aiConfiguration.upsert({
    where: { name: 'Default OpenAI Configuration' },
    update: {},
    create: {
      name: 'Default OpenAI Configuration',
      provider: 'openai',
      apiKeyEncrypted: 'encrypted-key-placeholder',
      model: 'gpt-4',
      fallbackModel: 'gpt-3.5-turbo',
      systemPrompt: `You are an AI assistant helping to document business processes in a structured SOP format.
Your goal is to ask clarifying questions to understand:
1. The exact steps of the process
2. Time taken for each step
3. Frequency of the task
4. Any pain points or manual steps
5. Data privacy concerns (KVKK compliance)
6. Automation potential

Be conversational but focused. Extract actionable information for process automation.`,
      maxTokens: 2000,
      temperature: 0.7,
      isActive: true,
    },
  });

  console.log('✅ AI Configuration created');

  // Create Sample Process
  const process = await prisma.process.create({
    data: {
      processName: 'Expense Report Upload',
      description: 'Process for uploading expense reports to ERP system',
      frequency: 12,
      duration: 7,
      costPerHour: 120,
      automationScore: 9,
      status: ProcessStatus.DRAFT,
      createdById: user.id,
      departmentId: accountingDepartment.id,
    },
  });

  // Create Process Version
  const processVersion = await prisma.processVersion.create({
    data: {
      processId: process.id,
      version: 1,
      sopJson: {
        title: 'Expense Report Upload SOP',
        summary: 'Standard procedure for uploading expense reports to the ERP system',
        steps: [
          {
            order: 1,
            action: 'Login to ERP system',
            estimatedTime: 30,
            tools: ['ERP Web Portal'],
            notes: 'Use company credentials',
          },
          {
            order: 2,
            action: 'Navigate to expense module',
            estimatedTime: 15,
            tools: ['ERP Web Portal'],
            notes: 'Located in Finance section',
          },
          {
            order: 3,
            action: 'Upload invoice file',
            estimatedTime: 120,
            tools: ['ERP Web Portal', 'File Scanner'],
            notes: 'Ensure invoice is in PDF format',
          },
          {
            order: 4,
            action: 'Fill in expense details',
            estimatedTime: 180,
            tools: ['ERP Web Portal'],
            notes: 'Include date, amount, category',
          },
          {
            order: 5,
            action: 'Submit for approval',
            estimatedTime: 30,
            tools: ['ERP Web Portal'],
            notes: 'Manager will be notified',
          },
        ],
        totalEstimatedTime: 375,
        automationPotential: {
          score: 9,
          reasoning: 'Highly repetitive task with structured data input',
          suggestedTools: ['n8n', 'Zapier', 'RPA'],
        },
        riskAssessment: {
          hasPersonalData: true,
          kvkkCompliance: 'Invoice data must be encrypted and stored securely',
          criticalSteps: [3, 4],
        },
      },
      formData: {
        frequency: 12,
        duration: 7,
        costPerHour: 120,
        hasPersonalData: true,
        department: 'Accounting',
      },
      createdById: user.id,
    },
  });

  await prisma.process.update({
    where: { id: process.id },
    data: { currentVersion: 1 },
  });

  console.log('✅ Sample process created');

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entity: 'System',
      entityId: 'seed-data',
      changes: { message: 'Database seeded with initial data' },
    },
  });

  console.log('✅ Audit log created');
  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('You can now login with:');
  console.log('  Admin: admin@vsttour.com / admin123');
  console.log('  Manager: manager@vsttour.com / manager123');
  console.log('  User: ayse.yilmaz@vsttour.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
