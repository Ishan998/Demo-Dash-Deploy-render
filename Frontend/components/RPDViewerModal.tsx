import React from "react";
import { RPD, RPDContentBlock, FeatureIcon } from "../types";

interface RPDViewerModalProps {
  rpd: RPD | null;
  onClose: () => void;
}

const FeatureIcons: Record<FeatureIcon, React.ReactNode> = {
  hypoallergenic: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 text-amber-800"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  lustrous: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 text-amber-800"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.476-1.476L12.938 18l1.188-.648a2.25 2.25 0 011.476-1.476L16.25 15l.648 1.188a2.25 2.25 0 011.476 1.476L19.562 18l-1.188.648a2.25 2.25 0 01-1.476 1.476z"
      />
    </svg>
  ),
  "hand-crafted": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 text-amber-800"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m0 0a4.5 4.5 0 00-6.364-6.364m6.364 6.364l-3.386-3.386a1.5 1.5 0 00-2.121 0l-3.386 3.386a4.5 4.5 0 000 6.364l3.386 3.386a1.5 1.5 0 002.121 0l3.386-3.386z"
      />
    </svg>
  ),
};

const RPDBlock: React.FC<{ block: RPDContentBlock }> = ({ block }) => {
  switch (block.layout) {
    case "image-text": {
      const { image, title, text, imagePosition } = block.props;
      const isLeft = imagePosition === "left";
      return (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center`}
        >
          <div className={` ${isLeft ? "md:order-1" : "md:order-2"}`}>
            <img
              src={image}
              alt={title}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div className={`prose ${isLeft ? "md:order-2" : "md:order-1"}`}>
            <h3 className="text-3xl font-semibold text-gray-800">{title}</h3>
            <p className="mt-2 text-gray-600">{text}</p>
          </div>
        </div>
      );
    }
    case "feature-list": {
      const { features } = block.props;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center flex flex-col items-center">
              {/* {FeatureIcons[feature.icon]} */}
              {feature.iconUrl ? (
                <img
                  src={feature.iconUrl}
                  alt={feature.title}
                  className="h-12 w-12 object-contain"
                />
              ) : feature.icon && FeatureIcons[feature.icon] ? (
                FeatureIcons[feature.icon]
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-gray-200 text-gray-500 text-xs rounded">
                  Icon
                </div>
              )}

              <h4 className="mt-4 font-semibold text-lg text-gray-800">
                {feature.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600">{feature.text}</p>
            </div>
          ))}
        </div>
      );
    }
    case "banner": {
      const { image, title, text } = block.props;
      return (
        <div className="relative w-full h-48 bg-gray-700 rounded-lg overflow-hidden my-8">
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="relative h-full flex flex-col items-center justify-center text-white text-center p-4">
            <h3 className="text-3xl font-bold">{title}</h3>
            <p className="mt-2 max-w-md">{text}</p>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
};

const RPDViewerModal: React.FC<RPDViewerModalProps> = ({ rpd, onClose }) => {
  if (!rpd) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-orange-50 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-bold text-text-primary text-center flex-grow">
            {rpd.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 -mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
          <div className="space-y-12">
            {rpd.content.map((block) => (
              <RPDBlock key={block.id} block={block} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RPDViewerModal;
