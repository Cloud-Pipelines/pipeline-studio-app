import {
  ABOUT_URL,
  BOTTOM_FOOTER_HEIGHT,
  GIT_COMMIT,
  GIT_REPO_URL,
  GIVE_FEEDBACK_URL,
  PRIVACY_POLICY_URL,
} from "@/utils/constants";

function AppFooter() {
  return (
    <footer
      className="footer w-full p-1 text-center bg-gray-50"
      style={{ height: `${BOTTOM_FOOTER_HEIGHT}px` }}
    >
      <div className="inline-block">
        <a
          href={ABOUT_URL}
          className="mx-1.5 text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
        </a>
        <a
          href={GIVE_FEEDBACK_URL}
          className="mx-1.5 text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Give feedback
        </a>
        <a
          href={PRIVACY_POLICY_URL}
          className="mx-1.5 text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy policy
        </a>
        Version:
        <a
          href={`${GIT_REPO_URL}/commit/${GIT_COMMIT}`}
          className="mx-1.5 text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {GIT_COMMIT.substring(0, 6)}
        </a>
      </div>
    </footer>
  );
}

export default AppFooter;
