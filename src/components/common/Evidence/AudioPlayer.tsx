import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  AudioWaveform,
} from "lucide-react";
import type { Evidencia } from "@/types/evidencia";

interface AudioPlayerProps {
  audio: Evidencia;
  onDownload?: (audio: Evidencia) => void;
}

export default function AudioPlayer({ audio, onDownload }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audioElement.duration);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("durationchange", handleDurationChange);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("durationchange", handleDurationChange);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (playing) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (value: number[]) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const time = value[0];
    audioElement.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const vol = value[0];
    audioElement.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const toggleMute = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (muted) {
      audioElement.volume = volume || 0.5;
      setMuted(false);
      setVolume(volume || 0.5);
    } else {
      audioElement.volume = 0;
      setMuted(true);
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <audio ref={audioRef} src={audio.url} preload="metadata" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <AudioWaveform className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Audio de evidencia</p>
            <p className="text-xs text-muted-foreground truncate">
              {audio.metadata?.originalFilename || `audio_${audio.id}`}
            </p>
          </div>
          {onDownload && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDownload(audio)}
              className="shrink-0"
            >
              <Download className="size-4" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            onClick={togglePlay}
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            {playing ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5 ml-0.5" />
            )}
          </Button>

          {/* Volume Controls */}
          <Button variant="ghost" size="icon" onClick={toggleMute}>
            {muted || volume === 0 ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </Button>

          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-24"
          />

          {/* Duration Badge */}
          <div className="flex-1" />
          {audio.metadata?.duration && (
            <span className="text-xs font-semibold bg-background px-2 py-1 rounded text-primary">
              {formatTime(audio.metadata.duration)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
