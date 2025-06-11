import { Github, Mail } from 'lucide-react';
import { siX } from 'simple-icons/icons';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img 
              src="https://raw.githubusercontent.com/muhammetselimfe/L1Beat/refs/heads/main/public/l1_logo_main_2.png"
              alt="L1Beat Logo"
              className="h-8 w-auto mb-4"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              L1Beat provides real-time analytics and monitoring for Avalanche L1s.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://docs.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Avalanche Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://subnets.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Avalanche Explorer
                </a>
              </li>
              <li>
                <a 
                  href="https://www.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Avalanche Network
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/L1Beat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="https://x.com/l1beat_io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="currentColor"
                >
                  <path d={siX.path} />
                </svg>
              </a>
              <a
                href="mailto:hello@l1beat.io"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-700">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built with ❤️ for the Avalanche community
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} L1Beat. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}