/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { Link } from "@mui/material";

function AppFooter() {
  return (
    <footer
      className="footer"
      style={{
        width: "100%",
        height: "30px",
        padding: "4px",
        textAlign: "center",
        backgroundColor: "ghostwhite",
      }}
    >
      <div style={{ display: "inline-block" }}>
        <Link
          href="https://cloud-pipelines.net/"
          underline="hover"
          target="_blank"
          rel="noopener"
          style={{ margin: "6px" }}
        >
          About
        </Link>
        <Link
          href="https://github.com/Cloud-Pipelines/pipeline-editor/issues"
          underline="hover"
          target="_blank"
          rel="noopener"
          style={{ margin: "6px" }}
        >
          Give feedback
        </Link>
        <Link
          href="https://cloud-pipelines.net/privacy_policy"
          underline="hover"
          target="_blank"
          rel="noopener"
          style={{ margin: "6px" }}
        >
          Privacy policy
        </Link>
      </div>
    </footer>
  );
}

export default AppFooter;
