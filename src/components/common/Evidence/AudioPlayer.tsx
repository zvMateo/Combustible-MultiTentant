import { useState, useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import DownloadIcon from "@mui/icons-material/Download";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import type { Evidencia } from "../../../types/reports";

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

  const handleSeek = (_event: Event, newValue: number | number[]) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const time = newValue as number;
    audioElement.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const vol = newValue as number;
    audioElement.volume = vol;
    setVolume(vol);
    if (vol === 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }
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
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        bgcolor: "#f8f9fa",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <audio ref={audioRef} src={audio.url} preload="metadata" />

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "#1E2C56",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <GraphicEqIcon />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Audio de evidencia
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {audio.filename || `audio_${audio.id}`}
            </Typography>
          </Box>
          {onDownload && (
            <IconButton
              onClick={() => onDownload(audio)}
              sx={{
                bgcolor: "white",
                "&:hover": {
                  bgcolor: "#f5f5f5",
                },
              }}
            >
              <DownloadIcon />
            </IconButton>
          )}
        </Box>

        {/* Player Controls */}
        <Box>
          {/* Progress Bar */}
          <Box sx={{ mb: 1 }}>
            <Slider
              value={currentTime}
              max={duration || 100}
              onChange={handleSeek}
              sx={{
                color: "#1E2C56",
                "& .MuiSlider-thumb": {
                  width: 14,
                  height: 14,
                },
              }}
            />
          </Box>

          {/* Time Display */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {formatTime(duration)}
            </Typography>
          </Box>

          {/* Control Buttons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Play/Pause */}
            <IconButton
              onClick={togglePlay}
              sx={{
                bgcolor: "#1E2C56",
                color: "white",
                width: 48,
                height: 48,
                "&:hover": {
                  bgcolor: "#16213E",
                },
              }}
            >
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            {/* Volume Controls */}
            <IconButton onClick={toggleMute} size="small">
              {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>

            <Slider
              value={muted ? 0 : volume}
              max={1}
              step={0.1}
              onChange={handleVolumeChange}
              sx={{
                maxWidth: 100,
                color: "#1E2C56",
              }}
            />

            {/* Duration Badge */}
            <Box sx={{ flexGrow: 1 }} />
            {audio.metadata?.duration && (
              <Typography
                variant="caption"
                sx={{
                  bgcolor: "white",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                  color: "#1E2C56",
                }}
              >
                {formatTime(audio.metadata.duration)}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

