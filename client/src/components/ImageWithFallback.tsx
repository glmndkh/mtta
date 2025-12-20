import { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHZpZXdCb3g9IjAgMCA4OCA4OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjOTk5Ij48Y2lyY2xlIGN4PSI0NCIgY3k9IjMwIiByPSIxNCIvPjxwYXRoIGQ9Ik0yMCA3MGMyLTE2IDEyLTI0IDI0LTI0czIyIDggMjQgMjR6Ii8+PC9zdmc+";

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, ...rest } = props;

  return didError ? (
    <div
      className={`inline-block bg-gray-200 dark:bg-gray-700 text-center align-middle ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt={alt || "Зураг байхгүй"} {...rest} data-original-url={src} className="opacity-40" />
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  );
}
