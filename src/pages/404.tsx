const NotFound: React.FC = () => {
  return (
    <div className="h-full flex flex-col gap-2 items-center justify-center">
      <span className="text-xl font-medium text-gray-300">404 SƏHİFƏ TAPILMADI</span>
      <code className="text-sm bg-blue-50 py-1 px-3 rounded-md text-gray-500">
        src/pages/404.tsx
      </code>
    </div>
  );
};

export default NotFound;
