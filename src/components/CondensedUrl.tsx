interface CondensedUrlProps {
  url: string;
  className?: string;
}

const CondensedUrl = ({ url, className }: CondensedUrlProps) => {
  return (
    <p className={className}>
      <a className="text-gray-500" href={url}>
        {new URL(url).hostname}
      </a>
      {url.includes("raw.githubusercontent.com") && (
        <a
          className="text-blue-500 ml-2"
          href={url
            .replace("raw.githubusercontent.com", "github.com")
            .replace(/\/([^/]+)\/([^/]+)\/([^/]+)\//, "/$1/$2/$3/tree/")}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Repo
        </a>
      )}
    </p>
  );
};

export default CondensedUrl;
