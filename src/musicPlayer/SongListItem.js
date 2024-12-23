import * as React from "react";

export const SongListItem = ({ song, isActive, onClick }) => (
  <div
    className={`text-white flex gap-10 justify-between items-center p-5 w-full rounded-lg max-w-[440px] ${
      isActive ? "bg-white bg-opacity-10" : ""
    } max-md:max-w-full cursor-pointer`}
    onClick={onClick}
  >
    <div className="flex gap-4 items-start self-stretch my-auto min-w-[240px]">
      <img
        loading="lazy"
        src={song.imageUrl}
        alt={`Album cover for ${song.title} by ${song.artist}`}
        className="object-contain shrink-0 w-12 aspect-square rounded-[56px]"
      />
      <div className="flex flex-col">
        <div className="text-lg leading-none">{song.title}</div>
        <div className="text-sm leading-6">{song.artist}</div>
      </div>
    </div>
    <div className="self-stretch my-auto text-lg leading-none text-right">
      {song.duration}
    </div>
  </div>
);
