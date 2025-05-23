import { Link } from "@/components/ui/link";

interface CondensedUrlProps {
  url: string;
  className?: string;
}

const CondensedUrl = ({ url, className }: CondensedUrlProps) => {
  return (
    <p className={className}>
      <a className="text-gray-500" href={url}>
        {url.split("/").pop()}
      </a>
      {url.includes("raw.githubusercontent.com") && (
        <Link
          className="text-blue-500 ml-2"
          href={url
            .replace("raw.githubusercontent.com", "github.com")
            .replace(/\/([^/]+)\/([^/]+)\/([^/]+)\//, "/$1/$2/$3/tree/")
            .replace(/\/[^/]+$/, "")}
          external
        >
          View Repo
        </Link>
      )}
    </p>
  );
};

export default CondensedUrl;
