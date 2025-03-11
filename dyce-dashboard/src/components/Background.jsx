import React, { useEffect } from "react";

const BackgroundCanvas = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/src/background.js";
    script.type = "module";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <canvas id="bg"></canvas>;
};

export default BackgroundCanvas;