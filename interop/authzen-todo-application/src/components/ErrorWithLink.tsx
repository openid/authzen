export const ErrorWithLink = () => (
  <div>
    <p>
      Error: failed to connect. This happens when the local server isn't
      running.
    </p>
    <p>
      <a
        href="https://github.com/aserto-demo/todo-application#backends"
        target="_blank"
        rel="noreferrer"
      >
        Refer to the docs to download and start a server in the language of your
        choice.
      </a>
    </p>
  </div>
);
