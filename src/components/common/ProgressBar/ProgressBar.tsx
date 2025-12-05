import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

const ProgressBar = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1300,
      }}
    >
      <LinearProgress
        sx={{
          "& .MuiLinearProgress-bar1Determinate": {
            backgroundColor: "var(--primary-color) !important",
            borderRadius: "4px !important",
          },
          "& .MuiLinearProgress-bar2Determinate": {
            backgroundColor: "var(--primary-color) !important",
            borderRadius: "4px !important",
          },

          // FONDO (la parte vacía)
          "& .MuiLinearProgress-root": {
            backgroundColor: "rgba(255, 255, 255, 0.3) !important",
            height: 4,
            borderRadius: 4,
          },

          // BUFFER (si usas indeterminate)
          "& .MuiLinearProgress-dashed": {
            backgroundImage: `linear-gradient(90deg, transparent 0%, transparent 30%, var(--primary-color) 50%, var(--primary-color) 70%, transparent 100%) !important`,
            backgroundSize: "10px 4px !important",
          },
        }}
        variant="indeterminate"
      />
    </Box>
  );
};

export default ProgressBar;
