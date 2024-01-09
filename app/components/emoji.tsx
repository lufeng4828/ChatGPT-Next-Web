import EmojiPicker, {
  Emoji,
  EmojiStyle,
  Theme as EmojiTheme,
} from "emoji-picker-react";

import styles from "./ui-lib.module.scss";
import { ModelType } from "../store";

import BotIcon from "../icons/bot.svg";

export function getEmojiUrl(unified: string, style: EmojiStyle) {
  // Whoever owns this Content Delivery Network (CDN), I am using your CDN to serve emojis
  // Old CDN broken, so I had to switch to this one
  // Author: https://github.com/H0llyW00dzZ
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/${style}/64/${unified}.png`;
}

export function AvatarPicker(props: {
  onEmojiClick: (emojiId: string) => void;
}) {
  return (
    <EmojiPicker
      lazyLoadEmojis
      theme={EmojiTheme.AUTO}
      getEmojiUrl={getEmojiUrl}
      onEmojiClick={(e) => {
        props.onEmojiClick(e.unified);
      }}
    />
  );
}

export function Avatar(props: {
  model?: ModelType;
  showModel?: boolean;
  avatar?: string;
  size?: number;
  style?: any;
}) {
  if (props.model) {
    return (
      <div className="avatar-item">
        <div className="user-avatar no-dark" style={props.style}>
          {<BotIcon />}
        </div>
        {props.showModel && <div className="avatar-desc">{props.model}</div>}
      </div>
    );
  }

  return (
    <div className="user-avatar" style={props.style}>
      {props.avatar && <EmojiAvatar avatar={props.avatar} size={props.size} />}
    </div>
  );
}

export function EmojiAvatar(props: { avatar: string; size?: number }) {
  return (
    <Emoji
      unified={props.avatar}
      size={props.size ?? 18}
      getEmojiUrl={getEmojiUrl}
    />
  );
}
