import Link from 'next/link';
import { ArrowRight, BarChart3, Bot, Workflow, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Workflow className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">VSTTour AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Business Processes with
            <span className="text-primary-600"> AI-Powered Automation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            VSTTour AI helps enterprises document, analyze, and automate their business processes
            with intelligent ROI estimation and seamless n8n workflow integration.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              Start Free Trial <ArrowRight className="inline ml-2 h-5 w-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Powerful Features for Process Excellence
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Process Analysis</h3>
            <p className="text-gray-600">
              Leverage OpenAI to automatically analyze and document your business processes with intelligent insights.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ROI Calculation</h3>
            <p className="text-gray-600">
              Calculate accurate ROI estimates based on time savings, cost reduction, and efficiency gains.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Workflow className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">n8n Integration</h3>
            <p className="text-gray-600">
              Export approved processes directly to n8n for seamless workflow automation and execution.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Security</h3>
            <p className="text-gray-600">
              Role-based access control, approval workflows, and comprehensive audit logging for compliance.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Process</h3>
              <p className="text-gray-600">
                Create and document your business processes with our intuitive interface or let AI assist you.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyze & Approve</h3>
              <p className="text-gray-600">
                Get AI-powered insights, calculate ROI, and route through approval workflows.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Automate</h3>
              <p className="text-gray-600">
                Export to n8n and start automating your processes immediately with powerful workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join leading enterprises using VSTTour AI to optimize their operations
          </p>
          <Link href="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors inline-block">
            Start Your Free Trial Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 VSTTour AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
