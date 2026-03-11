import { Composition } from "remotion";
import { FarmPrologueVideo } from "./FarmPrologueVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FarmPrologue"
        component={FarmPrologueVideo}
        durationInFrames={1140} // 38秒 @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName: "小麦老师",
        }}
      />
    </>
  );
};
