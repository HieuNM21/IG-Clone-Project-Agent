import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const StoryTray = ({ stories, currentUser }) => {
  // Group stories by user
  const userStories = useMemo(() => {
    const map = new Map();
    stories.forEach((story) => {
      if (!map.has(story.userId)) {
        map.set(story.userId, {
          userId: story.userId,
          username: story.username,
          avatarUrl: story.userAvatarUrl,
          stories: [],
        });
      }
      map.get(story.userId).stories.push(story);
    });
    return Array.from(map.values());
  }, [stories]);

  if (userStories.length === 0) return null;

  return (
    <div className="bg-ig-dark border border-ig-border rounded-xl p-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {userStories.map((userStory) => (
          <Link
            key={userStory.userId}
            to={`/profile/${userStory.username}`}
            className="flex flex-col items-center flex-shrink-0 group"
          >
            <div className="story-ring mb-1 transition-smooth group-hover:scale-105">
              <div className="story-ring-inner">
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
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StoryTray;
