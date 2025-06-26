import loaderVideo from '../assets/loader.mp4'; // ajusta el path si es necesario

export default function VideoLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-white bg-opacity-90 flex items-center justify-center">
      <video
        src={loaderVideo}
        autoPlay
        loop
        muted
        playsInline
        className="w-[40vw] h-[40vh] object-contain"
      />
    </div>
  );
}
