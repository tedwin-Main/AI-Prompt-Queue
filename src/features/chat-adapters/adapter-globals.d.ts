// Declares the page-global AIAdapter each chat adapter sets for the queue panel.
type ChatAdapter = {
  hostPattern: string;
  getInput: () => Element | null;
  getSubmit: () => Element | null;
  isGenerating: () => boolean;
  isResponseComplete: () => boolean;
};

declare global {
  var AIAdapter: ChatAdapter;
}

export {};
