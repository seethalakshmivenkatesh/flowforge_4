// Seed script: creates sample users, a project, tasks, and the demo workflow
// described in the spec ("High Priority Task Completion").
// Run with: npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Workflow = require('./models/Workflow');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');
const WorkflowExecution = require('./models/WorkflowExecution');

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Workflow.deleteMany({}),
    ActivityLog.deleteMany({}),
    Notification.deleteMany({}),
    WorkflowExecution.deleteMany({}),
  ]);

  console.log('Creating users...');
  const admin = await User.create({ name: 'Seetha Admin', email: 'admin@flowforge.dev', password: 'password123', role: 'Admin' });
  const pm = await User.create({ name: 'Arun Kumar', email: 'pm@flowforge.dev', password: 'password123', role: 'Project Manager' });
  const member1 = await User.create({ name: 'Divya Raj', email: 'divya@flowforge.dev', password: 'password123', role: 'Member' });
  const member2 = await User.create({ name: 'Karthik S', email: 'karthik@flowforge.dev', password: 'password123', role: 'Member' });

  console.log('Creating project...');
  const project = await Project.create({
    name: 'FlowForge Launch',
    description: 'Internal rollout of the FlowForge automation platform to the engineering org.',
    status: 'In Progress',
    priority: 'High',
    startDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    owner: admin._id,
    members: [pm._id, member1._id, member2._id],
    progress: 35,
  });

  console.log('Creating tasks...');
  const tasks = await Task.insertMany([
    {
      title: 'Design workflow builder UI',
      description: 'React Flow based visual editor for trigger -> condition -> action chains.',
      project: project._id,
      assignee: member1._id,
      reporter: pm._id,
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      labels: ['frontend', 'workflow'],
      checklist: [
        { text: 'Trigger node', done: true },
        { text: 'Condition node', done: false },
        { text: 'Action node', done: false },
      ],
    },
    {
      title: 'Implement workflow execution engine',
      description: 'Backend engine listening on the event bus and executing actions.',
      project: project._id,
      assignee: member2._id,
      reporter: pm._id,
      status: 'Review',
      priority: 'Critical',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      labels: ['backend', 'workflow'],
    },
    {
      title: 'Set up Socket.IO notifications',
      description: 'Real-time notification delivery for task and workflow events.',
      project: project._id,
      assignee: member1._id,
      reporter: admin._id,
      status: 'Todo',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      labels: ['backend', 'realtime'],
    },
    {
      title: 'Write onboarding documentation',
      description: 'README and setup docs for new engineers.',
      project: project._id,
      assignee: member2._id,
      reporter: admin._id,
      status: 'Todo',
      priority: 'Low',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      labels: ['docs'],
    },
    {
      title: 'Kanban drag-and-drop polish',
      description: 'Smooth animations and optimistic UI updates on column change.',
      project: project._id,
      assignee: pm._id,
      reporter: admin._id,
      status: 'Done',
      priority: 'Medium',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      labels: ['frontend'],
    },
  ]);

  console.log('Creating demo workflow: "High Priority Task Completion"...');
  await Workflow.create({
    name: 'High Priority Task Completion',
    description: 'When a task status changes and its priority is High, notify all project members.',
    project: project._id,
    createdBy: admin._id,
    trigger: { type: 'Task Status Changed' },
    conditions: [{ field: 'priority', operator: 'equals', value: 'High' }],
    actions: [{ type: 'sendNotification', params: { target: 'projectMembers', message: 'A high priority task was updated.' } }],
    enabled: true,
  });

  await Workflow.create({
    name: 'Auto-assign new tasks to PM',
    description: 'When a new task is created without an assignee, assign it to the Project Manager.',
    project: project._id,
    createdBy: admin._id,
    trigger: { type: 'Task Created' },
    conditions: [],
    actions: [{ type: 'assignTask', params: { userId: String(pm._id) } }],
    enabled: false,
  });

  console.log('Creating activity log entries...');
  await ActivityLog.insertMany([
    { project: project._id, actor: admin._id, action: `${admin.name} created project "${project.name}"` },
    { project: project._id, actor: pm._id, action: `${pm.name} assigned Task A to ${member1.name}` },
    { project: project._id, actor: member1.name ? member1._id : null, action: `${member1.name} moved "Kanban drag-and-drop polish" to Done` },
  ]);

  console.log('\nSeed complete!\n');
  console.log('Demo accounts (all passwords: password123):');
  console.log(`  Admin:            ${admin.email}`);
  console.log(`  Project Manager:  ${pm.email}`);
  console.log(`  Member:           ${member1.email}`);
  console.log(`  Member:           ${member2.email}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
