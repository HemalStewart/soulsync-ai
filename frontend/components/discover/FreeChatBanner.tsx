const FreeChatBanner = () => (
  <div className="mx-auto mb-8 max-w-7xl px-4">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 px-6 py-4 shadow-lg">
      <div className="min-h-[60px] flex items-center justify-between">
        <div className="flex-1 text-sm font-semibold leading-tight text-gray-800">
          🎉 30 Days of Free Text Chats!{' '}
          <button className="text-blue-600 font-semibold hover:underline">
            Join Now
          </button>
        </div>
        <p className="flex-1 text-xs text-gray-600 text-right">
          Membership during event = unlimited messaging.
        </p>
      </div>
    </div>
  </div>
);

export default FreeChatBanner;