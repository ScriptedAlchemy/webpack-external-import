import React from "react";
import "react-select";

export const Title = React.forwardRef(({ title }, ref) => {
  console.log('interleaved ref', ref);
  return (
    <h1 ref={ref}>
        TITLE COMPONENT:
      {title}
    </h1>
  );
});

/* externalize:TitleComponent */
