/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

function AppFooter() {
  return (
    <footer className="footer w-full h-[30px] p-1 text-center bg-gray-50">
      <div className="inline-block">
        <a
          href="https://cloud-pipelines.net/"
          className="mx-1.5 text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
        </a>
        <a
          href="https://github.com/Cloud-Pipelines/pipeline-editor/issues"
          className="mx-1.5 text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Give feedback
        </a>
        <a
          href="https://cloud-pipelines.net/privacy_policy"
          className="mx-1.5 text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy policy
        </a>
      </div>
    </footer>
  );
}

export default AppFooter;
