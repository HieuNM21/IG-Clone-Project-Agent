import { useMemo, useState } from 'react';
import CreateStoryModal from './CreateStoryModal';
import { FiPlus } from 'react-icons/fi';

const StoryTray = ({ stories, currentUser, onStoryCreated }) => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [viewedUserIds, setViewedUserIds] = useState(new Set());

  // Group stories by user
  const userStories = useMemo(() => {
    const map = new Map();
    stories.forEach((story) => {
      const uid = story.userId;
      if (!map.has(uid)) {
        map.set(uid, {
          userId: uid,
          username: story.username,
          avatarUrl: story.userAvatarUrl,
          stories: [],
        });
      }
      map.get(uid).stories.push(story);
    });
    return Array.from(map.values());
  }, [stories]);

  const handleViewStory = (userStory) => {
    setViewingStory(userStory);
    setViewedUserIds((prev) => new Set([...prev, userStory.userId]));
  };

  const closeStoryViewer = () => setViewingStory(null);

  return (
    <>
      <div className="bg-ig-dark border border-ig-border rounded-xl p-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {/* Add Story button */}
          <button
            onClick={() => setShowCreateStory(true)}
            className="flex flex-col items-center flex-shrink-0 group"
          >
            <div className="relative mb-1 transition-smooth group-hover:scale-105">
              <div className="w-14 h-14 rounded-full bg-ig-card border-2 border-dashed border-ig-border flex items-center justify-center group-hover:border-ig-primary transition-smooth">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="You" className="w-full h-full object-cover rounded-full opacity-60" />
                ) : (
                  <span className="text-lg text-ig-text-secondary">{currentUser?.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-ig-primary flex items-center justify-center border-2 border-ig-dark">
                <FiPlus className="text-white text-xs" />
              </div>
            </div>
            <span className="text-xs text-ig-text-secondary group-hover:text-ig-text transition-smooth truncate w-16 text-center">
              Your story
            </span>
          </button>

          {/* Story avatars – click to view story */}
          {userStories.map((userStory) => {
            const isViewed = viewedUserIds.has(userStory.userId);
            return (
              <button
                key={userStory.userId}
                onClick={() => handleViewStory(userStory)}
                className="flex flex-col items-center flex-shrink-0 group"
              >
                {/* Gradient ring if unseen, gray ring if viewed */}
                <div className={`mb-1 transition-smooth group-hover:scale-105 p-[2px] rounded-full ${
                  isViewed
                    ? 'bg-ig-border'
                    : 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]'
                }`}>
                  <div className="bg-ig-darker p-[2px] rounded-full">
                    <div className="w-14 h-14 rounded-full bg-ig-card flex items-center justify-center overflow-hidden">
                      {userStory.avatarUrl ? (
                        <img src={userStory.avatarUrl} alt={userStory.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg text-ig-text-secondary">{userStory.username[0].toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-ig-text-secondary group-hover:text-ig-text transition-smooth truncate w-16 text-center">
                  {userStory.userId === currentUser?.id ? 'Your story' : userStory.username}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={closeStoryViewer}>
          <div className="relative max-w-md w-full max-h-[80vh] fade-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 p-4 bg-gradient-to-b from-black/60 to-transparent rounded-t-xl">
              <div className="w-8 h-8 rounded-full bg-ig-card overflow-hidden flex items-center justify-center">
                {viewingStory.avatarUrl ? (
                  <img src={viewingStory.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs">{viewingStory.username[0].toUpperCase()}</span>
                )}
              </div>
              <span className="text-white font-semibold text-sm">{viewingStory.username}</span>
              <button onClick={closeStoryViewer} className="ml-auto text-white text-2xl hover:opacity-70">&times;</button>
            </div>

            {/* Story image */}
            <img
              src={viewingStory.stories[0]?.mediaUrl}
              alt="Story"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={(story) => {
            setShowCreateStory(false);
            onStoryCreated?.(story);
          }}
        />
      )}
    </>
  );
};

export default StoryTray;
