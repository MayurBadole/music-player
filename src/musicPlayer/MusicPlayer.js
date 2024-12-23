import { React, useEffect, useState, useRef, useMemo } from "react";
import { SongListItem } from "./SongListItem";
import { songsList, navigationItems } from "./data";

const MusicPlayers = () => {
  const [selectedTab, setSelectedTab] = useState("For You");
  const [selectedSong, setSelectedSong] = useState(songsList[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const [bgColor, setBgColor] = useState("#000");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [recentlyPlayed, setRecentlyPlayed] = useState(
    JSON.parse(sessionStorage.getItem("recentlyPlayed")) || []
  );

  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );

  // For dropdown menu visibility
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const getDominantColor = (imageUrl) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Required if the image is from a different domain

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Calculate the average color
      let r = 0,
        g = 0,
        b = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);

      const dominantColor = `rgb(${r}, ${g}, ${b})`;
      setBgColor(dominantColor);
    };

    img.src = imageUrl;
  };

  useEffect(() => {
    getDominantColor(selectedSong.imageUrl);
  }, [selectedSong.imageUrl]);

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const playNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % songsList.length;
    setCurrentTrackIndex(nextIndex);
    setSelectedSong(songsList[nextIndex]);
    addToRecentlyPlayed(songsList[nextIndex]);
  };

  const playPreviousTrack = () => {
    const prevIndex =
      (currentTrackIndex - 1 + songsList.length) % songsList.length;
    setCurrentTrackIndex(prevIndex);
    setSelectedSong(songsList[prevIndex]);
    addToRecentlyPlayed(songsList[prevIndex]);
  };
  const addToRecentlyPlayed = (song) => {
    if (!recentlyPlayed.find((playedSong) => playedSong.id === song.id)) {
      const updatedRecentlyPlayed = [song, ...recentlyPlayed].slice(0, 10);

      setRecentlyPlayed(updatedRecentlyPlayed);

      sessionStorage.setItem(
        "recentlyPlayed",
        JSON.stringify(updatedRecentlyPlayed)
      );
    }
  };

  const toggleFavorite = (song) => {
    const isAlreadyFavorite = favorites.some((fav) => fav.id === song.id);
    let updatedFavorites;

    if (isAlreadyFavorite) {
      updatedFavorites = favorites.filter((fav) => fav.id !== song.id);
    } else {
      updatedFavorites = [...favorites, song];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  useEffect(() => {
    if (selectedTab === "Favorites") {
      setIsPlaying(false);
    }
  }, [selectedTab]);

  const removeDuplicates = (songs) => {
    const uniqueSongs = [];
    const songIds = new Set();

    songs.forEach((song) => {
      if (!songIds.has(song.id)) {
        uniqueSongs.push(song);
        songIds.add(song.id);
      }
    });

    return uniqueSongs;
  };

  const filteredSongs = useMemo(() => {
    const allSongs = (() => {
      switch (selectedTab) {
        case "For You":
          return removeDuplicates(songsList);
        case "Top Tracks":
          return removeDuplicates(songsList)
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
        case selectedTab === "Favourites":
          return favorites.length > 0
            ? removeDuplicates(favorites)
            : [
                {
                  id: "no-favorites",
                  title: "Please add songs to favorites",
                  artist: "",
                  imageUrl: "",
                },
              ];
        case "Recently Played":
          return recentlyPlayed.length > 0
            ? removeDuplicates(recentlyPlayed)
            : [
                {
                  id: "no-recently-played",
                  title: "No recently played songs",
                  artist: "",
                  imageUrl: "",
                },
              ];
        default:
          return removeDuplicates(songsList);
      }
    })();

    // Filter by search term if it's not empty
    if (searchTerm.trim()) {
      return allSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return allSongs;
  }, [selectedTab, favorites, recentlyPlayed, searchTerm]);

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
  };

  const toggleVolumeVisibility = () => {
    setIsVolumeVisible(!isVolumeVisible);
  };

  // Handle the dropdown visibility toggle
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };
  // Initialize the audioRef
  const audioRef = useRef(null);

  // Create the audio element when the component mounts
  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      // Cleanup the audio instance on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Update the audio source and play/pause based on state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = selectedSong.audioUrl;
      audioRef.current.volume = volume / 100;
      if (isPlaying) {
        audioRef.current
          .play()
          .then(() => console.log("Audio playing..."))
          .catch((error) =>
            console.error("Audio playback failed. Error:", error)
          );
      } else {
        audioRef.current.pause();
      }
    }
  }, [selectedSong, isPlaying, volume]);

  // Update time on audio progress
  useEffect(() => {
    const updateCurrentTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setTrackDuration(audioRef.current.duration || 0);
      }
    };

    audioRef.current?.addEventListener("timeupdate", updateCurrentTime);
    return () => {
      audioRef.current?.removeEventListener("timeupdate", updateCurrentTime);
    };
  }, []);

  // Format time in mm:ss
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  return (
    <div
      className="flex overflow-hidden flex-wrap justify-between pt-8 pr-[157px] pl-8 rounded-lg max-md:px-5 text-white bg-gray-500"
      style={{ background: `linear-gradient(to bottom, ${bgColor}, #333)` }}
    >
      <div className="flex justify-between flex-col">
        <div className="flex flex-col items-start self-start text-xl leading-relaxed text-white">
          <img src="./Logo.svg" alt="logo" />
          {navigationItems.map((item) => (
            <button
              key={item.label}
              className={`${
                selectedTab === item.label ? "text-white" : "text-[#BEBEBE]"
              } mt-6 focus:outline-none text-start`}
              onClick={() => setSelectedTab(item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <img src="./Profile.png" alt="profile" />
        </div>
      </div>

      <div className="flex flex-col mt-2 text-white max-md:max-w-full">
        <div className="self-start text-3xl font-bold leading-none">
          {selectedTab}
        </div>
        <form className="flex gap-10 justify-between items-center px-4 py-2 mt-6 text-lg leading-loose rounded-lg bg-white bg-opacity-10 min-w-[400px]">
          <label htmlFor="searchInput" className="sr-only">
            Search Song, Artist
          </label>
          <input
            type="search"
            id="searchInput"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Song, Artist"
            className="bg-transparent border-none outline-none flex-1 text-white placeholder-white"
          />
          {!searchTerm && (
            <img
              loading="lazy"
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/3df3222a0721ee745e66aeb2cc9d677341c9617aeadf94d94a1e464071036f70?placeholderIfAbsent=true&apiKey=2f7f9d26055745daa160139fc29cf778"
              alt="Search"
              className="object-contain shrink-0 self-stretch my-auto w-8 aspect-square"
            />
          )}
        </form>

        <div className="flex flex-col mt-6 w-full max-md:max-w-full">
          {selectedTab !== "Favourites" &&
            (filteredSongs.length > 0 ? (
              filteredSongs.map((song) =>
                song.id === "no-favorites" ? (
                  <div
                    key={song.id}
                    className="text-center text-gray-400 italic py-4"
                  >
                    {song.title}
                  </div>
                ) : (
                  <SongListItem
                    key={song.id}
                    song={song}
                    isActive={song.title === selectedSong.title}
                    onClick={() => {
                      setIsPlaying(true);
                      setIsDropdownVisible(false);
                      setIsVolumeVisible(false);
                      setSelectedSong(song);
                      setCurrentTrackIndex(songsList.indexOf(song));
                      addToRecentlyPlayed(song);
                    }}
                  />
                )
              )
            ) : (
              <div className="text-center text-gray-400 italic py-4">
                No songs available.
              </div>
            ))}

          {selectedTab === "Favourites" &&
            (favorites.length > 0 ? (
              favorites.map((song) => (
                <SongListItem
                  key={song.id}
                  song={song}
                  isActive={song.title === selectedSong.title}
                  onClick={() => {
                    setIsPlaying(true);
                    setIsDropdownVisible(false);
                    setIsVolumeVisible(false);
                    setSelectedSong(song);
                    setCurrentTrackIndex(songsList.indexOf(song));
                    addToRecentlyPlayed(song);
                  }}
                />
              ))
            ) : (
              <div className="text-center text-gray-400 italic py-4">
                No favorite songs available.
              </div>
            ))}
        </div>
      </div>

      {/* Song Details Section */}
      <div className="flex flex-col max-md:max-w-full pt-[62px] pb-[91px]">
        <div className="flex flex-col self-start text-white">
          <div className="text-3xl font-bold leading-none">
            {selectedSong.title}
          </div>
          <div className="mt-2 text-base">{selectedSong.artist}</div>
        </div>

        <div className="flex flex-col mt-10 max-w-full w-[480px]">
          <img
            loading="lazy"
            src={selectedSong.imageUrl}
            alt={`Album artwork for ${selectedSong.title} by ${selectedSong.artist}`}
            className="object-contain w-full rounded-lg aspect-square"
          />
          <div className="w-full flex flex-col items-center mb-4 bg-transperant p-4">
            <div className="flex justify-between items-center w-full text-black mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(trackDuration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={trackDuration || 100}
              value={currentTime}
              onChange={(e) => {
                const newTime = e.target.value;
                setCurrentTime(newTime);
                if (audioRef.current) {
                  audioRef.current.currentTime = newTime;
                }
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-10 items-start mt-2 max-md:max-w-full justify-between">
          <button
            aria-label="Like song"
            className="focus:outline-none relative"
            tabIndex={0}
            onClick={toggleDropdown} // Toggle the dropdown menu
          >
            <img
              loading="lazy"
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/d1ccb89f5e480c03261517a946061d62e05648e54c698601c75a40742e0bcf66?placeholderIfAbsent=true&apiKey=2f7f9d26055745daa160139fc29cf778"
              alt="Like"
              className="object-contain shrink-0 w-12 aspect-square"
            />
            {/* Dropdown Menu */}
            {isDropdownVisible && (
              <div className="absolute top-full mt-2 right-0 w-40 bg-white text-black rounded-md shadow-lg">
                <ul>
                  <li
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      toggleFavorite(selectedSong);
                      setIsDropdownVisible(false); // Close the dropdown after action
                    }}
                  >
                    {favorites.some((fav) => fav.id === selectedSong.id)
                      ? "Remove from Favourite"
                      : "Mark as Favourite"}
                  </li>
                </ul>
              </div>
            )}
          </button>

          <div className="flex gap-8 justify-between items-center w-44 min-h-[50px]">
            <button
              aria-label="Previous track"
              className="focus:outline-none"
              tabIndex={0}
              onClick={playPreviousTrack}
            >
              <img
                loading="lazy"
                src="./prev.png"
                alt="Previous"
                className="object-contain shrink-0 self-stretch my-auto w-8 aspect-square"
              />
            </button>
            <button
              aria-label="Play/Pause"
              className="focus:outline-none"
              tabIndex={0}
              onClick={togglePlayPause}
            >
              <img
                loading="lazy"
                src={!isPlaying ? "./start.png" : "./pouse.png"}
                alt={!isPlaying ? "Pause" : "Play"}
                className="object-contain shrink-0 self-stretch my-auto w-12 aspect-square"
              />
            </button>

            <button
              aria-label="Next track"
              className="focus:outline-none"
              tabIndex={0}
              onClick={playNextTrack}
            >
              <img
                loading="lazy"
                src="./next.png"
                alt="Next"
                className="object-contain shrink-0 self-stretch my-auto w-8 aspect-square"
              />
            </button>
          </div>
          <div className="flex flex-col items-end">
            <button
              aria-label="Volume control"
              className="flex overflow-hidden flex-col justify-center items-center px-px w-12 h-12 bg-white bg-opacity-10 min-h-[48px] rounded-[72px] focus:outline-none"
              tabIndex={0}
              onClick={toggleVolumeVisibility} // Toggle the volume slider visibility
            >
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/794a7e0e2130be5572fdfaf7f75d8255a32ddcc0d57b44b2772c566d9a27ff3a?placeholderIfAbsent=true&apiKey=2f7f9d26055745daa160139fc29cf778"
                alt="Volume"
                className="object-contain w-5 aspect-[1.25]"
              />
            </button>
            {isVolumeVisible && (
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 mt-2"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayers;
