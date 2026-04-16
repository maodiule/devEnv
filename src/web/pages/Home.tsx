
import { useState, useEffect } from 'react';

export default function Home() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    // 加载镜像数据
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data = await response.json();
        setImages(data.data || []);
      } catch (err) {
        setError('获取镜像列表失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images');
      const data = await response.json();
      setImages(data.data || []);
    } catch (err) {
      setError('获取镜像列表失败');
      console.error(err);
    }
  };

  const handleStartContainer = async (id) => {
    try {
      setActionLoading(id);
      const response = await fetch(`/api/containers/${id}/start`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // 重新加载镜像数据
        await fetchImages();
      } else {
        console.log(data.error || '启动容器失败');
      }
    } catch (err) {
      console.log('启动容器失败');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopContainer = async (id) => {
    try {
      setActionLoading(id);
      const response = await fetch(`/api/containers/${id}/stop`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // 重新加载镜像数据
        await fetchImages();
      } else {
        console.log(data.error || '停止容器失败');
      }
    } catch (err) {
      console.log('停止容器失败');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      setActionLoading(id);
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        // 重新加载镜像数据
        await fetchImages();
      } else {
        console.log(data.error || '删除镜像失败');
      }
    } catch (err) {
      console.log('删除镜像失败');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">DevEnv 可视化界面</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">暂无镜像数据</p>
            <p className="text-slate-400 mt-2">请使用 `devenv init` 初始化配置，然后使用 `devenv build` 构建镜像</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-lg font-semibold text-slate-700">总镜像数: <span className="text-blue-600">{images.length}</span></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div key={image.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 mb-2">{image.projectName}</h2>
                      <p className="text-slate-500 mb-2">{image.name}:{image.tag}</p>
                      <p className="text-xs text-slate-400">镜像 ID: {image.id}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={actionLoading === image.id}
                      className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-md transition-colors disabled:opacity-50"
                    >
                      {actionLoading === image.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-500">镜像状态: <span className={`font-medium ${image.containerRunning ? 'text-green-600' : 'text-slate-600'}`}>{image.containerRunning ? '运行中' : '未运行'}</span></p>
                    <p className="text-sm text-slate-500">语言: <span className="font-medium">{image.language} {image.version}</span></p>
                  </div>

                  <div className="flex space-x-2">
                    {image.containerRunning ? (
                      <button 
                        onClick={() => handleStopContainer(image.id)}
                        disabled={actionLoading === image.id}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === image.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>停止中...</span>
                          </div>
                        ) : (
                          '停止容器'
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStartContainer(image.id)}
                        disabled={actionLoading === image.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === image.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>启动中...</span>
                          </div>
                        ) : (
                          '启动容器'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

