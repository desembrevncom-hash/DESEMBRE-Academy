import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { academyAccessApi, AcademyStudentAccessSummary, StudentCourseAccessOverride } from "@/features/admin/services/academyAccessApi";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import { AcademyAdminCourseListItem } from "@/features/admin/types";
import { Search, Loader2, ShieldAlert, KeyRound, Clock, Trash2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getStudentDisplayName, maskEmail, maskPhone, shortId } from "@/utils/privacy";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/academy-access")({
  component: AcademyAccessAdmin,
});

function AcademyAccessAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<AcademyStudentAccessSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<AcademyStudentAccessSummary | null>(null);

  const [overrides, setOverrides] = useState<StudentCourseAccessOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [courses, setCourses] = useState<AcademyAdminCourseListItem[]>([]);
  
  // Form State
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState<string>("7");
  const [reason, setReason] = useState("");
  const [granting, setGranting] = useState(false);
  
  // Revoke Modal State
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokingOverride, setRevokingOverride] = useState<StudentCourseAccessOverride | null>(null);
  const [revokeConfirmText, setRevokeConfirmText] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  // Block Access State
  const [selectedBlockCourseId, setSelectedBlockCourseId] = useState("");
  const [blockExpiryDays, setBlockExpiryDays] = useState<string>("");
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    academyAdminCoursesApi.listCourses().then(data => {
      setCourses(data);
    }).catch(e => {
      console.error("Failed to load courses", e);
    });
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    loadOverrides(selectedStudent.id);
  }, [selectedStudent]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setLoadingSearch(true);
    try {
      const data = await academyAccessApi.searchStudents(search.trim());
      setSearchResults(data);
    } catch (err) {
      toast.error("Tìm kiếm thất bại");
    } finally {
      setLoadingSearch(false);
    }
  };

  const loadOverrides = async (studentId: string) => {
    setLoadingOverrides(true);
    try {
      const data = await academyAccessApi.listStudentAccess(studentId);
      setOverrides(data);
    } catch (err) {
      toast.error("Không thể tải danh sách quyền truy cập");
    } finally {
      setLoadingOverrides(false);
    }
  };

  const handleGrant = async () => {
    if (!selectedStudent) return;
    if (!selectedCourseId) return toast.error("Vui lòng chọn khoá học");
    if (scopes.length === 0) return toast.error("Vui lòng chọn ít nhất 1 quyền (scope)");
    if (reason.trim().length < 10) return toast.error("Lý do phải dài ít nhất 10 ký tự");
    
    setGranting(true);
    try {
      const expiresAt = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString();
      await academyAccessApi.grantAccess(selectedStudent.id, selectedCourseId, scopes, expiresAt, reason);
      toast.success("Cấp quyền thành công");
      
      setSelectedCourseId("");
      setScopes([]);
      setReason("");
      
      queryClient.invalidateQueries({ queryKey: ["lesson-content"] });
      queryClient.invalidateQueries({ queryKey: ["current-courses"] });
      loadOverrides(selectedStudent.id);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cấp quyền");
    } finally {
      setGranting(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedStudent) return;
    if (!selectedBlockCourseId) return toast.error("Vui lòng chọn khoá học");
    if (blockReason.trim().length < 10) return toast.error("Lý do phải dài ít nhất 10 ký tự");
    
    setBlocking(true);
    try {
      const expiresAt = blockExpiryDays ? new Date(Date.now() + parseInt(blockExpiryDays) * 24 * 60 * 60 * 1000).toISOString() : null;
      await academyAccessApi.blockAccess(selectedStudent.id, selectedBlockCourseId, expiresAt, blockReason);
      toast.success("Khóa quyền xem khóa học thành công");
      
      setSelectedBlockCourseId("");
      setBlockReason("");
      
      queryClient.invalidateQueries({ queryKey: ["lesson-content"] });
      queryClient.invalidateQueries({ queryKey: ["current-courses"] });
      loadOverrides(selectedStudent.id);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi khóa quyền");
    } finally {
      setBlocking(false);
    }
  };

  const openRevokeModal = (override: StudentCourseAccessOverride) => {
    setRevokingOverride(override);
    setRevokeConfirmText("");
    setRevokeReason("");
    setRevokeModalOpen(true);
  };

  const confirmRevoke = async () => {
    if (!selectedStudent || !revokingOverride) return;
    if (revokeConfirmText !== "REVOKE_COURSE_ACCESS") {
      return toast.error("Bạn cần nhập đúng: REVOKE_COURSE_ACCESS");
    }
    if (revokeReason.trim().length < 10) {
      return toast.error("Lý do thu hồi tối thiểu 10 ký tự");
    }

    setRevoking(true);
    try {
      await academyAccessApi.revokeAccess(revokingOverride.id, revokeReason);
      toast.success("Đã thu hồi quyền truy cập");
      setRevokeModalOpen(false);
      setRevokingOverride(null);
      queryClient.invalidateQueries({ queryKey: ["lesson-content"] });
      queryClient.invalidateQueries({ queryKey: ["current-courses"] });
      loadOverrides(selectedStudent.id);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thu hồi");
    } finally {
      setRevoking(false);
    }
  };

  const now = new Date();
  
  const activeAllowOverrides = overrides.filter(o => o.decision === 'allow' && o.is_active);
  const activeDenyOverrides = overrides.filter(o => {
    if (o.decision !== 'deny') return false;
    const start = new Date(o.starts_at);
    const expiry = o.expires_at ? new Date(o.expires_at) : null;
    return start <= now && (!expiry || expiry > now);
  });
  
  const historyOverrides = overrides.filter(o => {
    if (o.decision === 'allow') return !o.is_active;
    const start = new Date(o.starts_at);
    const expiry = o.expires_at ? new Date(o.expires_at) : null;
    return start > now || (expiry && expiry <= now);
  });

  // Derived state for the Grant Form
  const activeScopesForSelectedCourse = activeAllowOverrides
    .filter(o => o.course_id === selectedCourseId)
    .map(o => o.access_scope);

  const isEnrollActive = activeScopesForSelectedCourse.includes('enroll');
  const isFullActive = activeScopesForSelectedCourse.includes('full');

  // Prevent selecting already active scopes
  const handleScopeChange = (scope: string, isActive: boolean) => {
    if (isActive) return;
    setScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  // Enforce validation state
  const isGrantDisabled = granting || !selectedCourseId || scopes.length === 0 || reason.trim().length < 10 || (isEnrollActive && isFullActive);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Course Access Control</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Select Student */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Tìm kiếm học viên</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by masked phone, account ID, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={loadingSearch || !search.trim()}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center"
              >
                {loadingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tìm"}
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {searchResults.length === 0 && !loadingSearch && search && (
                <div className="text-sm text-slate-500 text-center py-4">Không tìm thấy học viên</div>
              )}
              {searchResults.map(student => (
                <div 
                  key={student.id} 
                  onClick={() => {
                    setSelectedStudent(student);
                    setSelectedCourseId("");
                    setScopes([]);
                    setReason("");
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium text-sm text-slate-900">
                    {getStudentDisplayName(student.display_name, student.email, student.phone, student.id)}
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1 font-mono">
                    <span>Acc: {shortId(student.id)}</span>
                    {student.customer_id && <span>Cust: {shortId(student.customer_id)}</span>}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {student.email ? maskEmail(student.email) : "-"} | {student.phone ? maskPhone(student.phone) : "-"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      student.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Manage Access */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedStudent ? (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-500 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 mb-4 text-slate-300" />
              <p>Chọn một học viên bên trái để quản lý quyền truy cập ngoại lệ (Overrides)</p>
            </div>
          ) : (
            <>
              {/* Active Allow Overrides */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="font-semibold text-slate-900 flex items-center">
                    <KeyRound className="w-4 h-4 mr-2 text-green-600" />
                    Quyền được cấp đang hiệu lực
                  </h2>
                </div>
                <div className="p-0">
                  {loadingOverrides ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></div>
                  ) : activeAllowOverrides.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">Không có quyền cấp nào đang hiệu lực.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Khóa học</th>
                          <th className="px-4 py-3 text-left font-medium">Quyền</th>
                          <th className="px-4 py-3 text-left font-medium">Hết hạn</th>
                          <th className="px-4 py-3 text-right font-medium">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeAllowOverrides.map(o => (
                          <tr key={o.id} className="bg-white">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{o.course_title}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={o.reason}>{o.reason}</div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase border bg-blue-50 text-blue-700 border-blue-100`}>
                                  {o.access_scope}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center text-xs text-amber-600 font-medium">
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                {o.expires_at ? new Date(o.expires_at).toLocaleDateString() : 'Vĩnh viễn'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openRevokeModal(o)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded"
                                title="Thu hồi quyền cấp tạm thời"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Active Deny Overrides */}
              {activeDenyOverrides.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm overflow-hidden mt-6">
                  <div className="px-5 py-4 border-b border-red-100 flex justify-between items-center bg-red-100/50">
                    <h2 className="font-semibold text-red-700 flex items-center">
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Khóa truy cập đang hiệu lực
                    </h2>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-red-50/50 border-b border-red-100 text-red-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Khóa học</th>
                          <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                          <th className="px-4 py-3 text-left font-medium">Hết hạn</th>
                          <th className="px-4 py-3 text-right font-medium">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {activeDenyOverrides.map(o => (
                          <tr key={o.id} className="bg-white">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{o.course_title}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={o.reason}>{o.reason}</div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase border bg-red-50 text-red-700 border-red-100`}>
                                  ĐANG BỊ KHÓA
                                </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center text-xs text-amber-600 font-medium">
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                {o.expires_at ? new Date(o.expires_at).toLocaleDateString() : 'Vĩnh viễn'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openRevokeModal(o)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-xs font-medium border border-red-200"
                                title="Hủy bỏ lệnh khóa (Unblock)"
                              >
                                Hủy khóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expired Overrides History */}
              {historyOverrides.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-70 mt-6">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-semibold text-slate-600 flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      Lịch sử quyền đã hết hạn / bị thu hồi
                    </h2>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Khóa học</th>
                          <th className="px-4 py-2 text-left font-medium">Quyền</th>
                          <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyOverrides.map(o => (
                          <tr key={o.id} className="bg-slate-50/50">
                            <td className="px-4 py-2">
                              <div className="text-slate-500">{o.course_title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1" title={o.reason}>{o.reason}</div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-slate-500 uppercase">{o.access_scope}</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center text-slate-400">
                                <XCircle className="w-3 h-3 mr-1" />
                                {o.decision === 'deny' ? 'Đang bị khóa' : 'Đã hết hạn/Thu hồi'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grant Form */}
              <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden ring-1 ring-blue-500/5">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                  <h2 className="font-semibold text-slate-900 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                    Cấp Quyền Mới
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Khóa học <span className="text-red-500">*</span></label>
                    <select 
                      value={selectedCourseId}
                      onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setScopes([]); // Reset scopes when changing course
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">-- Chọn khóa học --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.status})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phạm vi quyền (Scopes) <span className="text-red-500">*</span></label>
                    {selectedCourseId ? (
                      <div className="flex gap-6">
                        <label className={`flex flex-col gap-1 ${isEnrollActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={scopes.includes('enroll') || isEnrollActive} 
                              onChange={() => handleScopeChange('enroll', isEnrollActive)} 
                              disabled={isEnrollActive}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50" 
                            />
                            <span className="text-sm font-medium">Enroll</span>
                          </div>
                          <span className="text-xs text-slate-500 ml-5">
                            {isEnrollActive ? "Đã có quyền ENROLL đang hiệu lực" : "Quyền bấm đăng ký"}
                          </span>
                        </label>
                        <label className={`flex flex-col gap-1 ${isFullActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={scopes.includes('full') || isFullActive} 
                              onChange={() => handleScopeChange('full', isFullActive)} 
                              disabled={isFullActive}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50" 
                            />
                            <span className="text-sm font-medium">Full</span>
                          </div>
                          <span className="text-xs text-slate-500 ml-5">
                            {isFullActive ? "Đã có quyền FULL đang hiệu lực" : "Quyền vào học"}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 italic">Vui lòng chọn khóa học trước.</div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Thời hạn <span className="text-red-500">*</span></label>
                      <select 
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="7">7 Ngày</option>
                        <option value="14">14 Ngày</option>
                        <option value="30">30 Ngày</option>
                        <option value="90">90 Ngày (Tối đa)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lý do cấp quyền <span className="text-red-500">*</span></label>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ghi rõ lý do tối thiểu 10 ký tự (VD: Cấp quyền test Smoke Phase B...)"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleGrant}
                        disabled={isGrantDisabled}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {granting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                        Cấp Quyền
                      </Button>
                    </div>
                    {/* Validation Hints */}
                    <div className="text-xs text-right space-y-1">
                      {!selectedCourseId && <p className="text-amber-600">⚠️ Vui lòng chọn khóa học</p>}
                      {selectedCourseId && scopes.length === 0 && (!isEnrollActive || !isFullActive) && <p className="text-amber-600">⚠️ Vui lòng chọn ít nhất 1 scope</p>}
                      {selectedCourseId && isEnrollActive && isFullActive && <p className="text-amber-600">⚠️ Khóa học này đã được cấp đủ quyền</p>}
                      {reason.trim().length > 0 && reason.trim().length < 10 && <p className="text-amber-600">⚠️ Lý do tối thiểu 10 ký tự</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Block Form */}
              <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden ring-1 ring-red-500/5 mt-6">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
                  <h2 className="font-semibold text-slate-900 flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2 text-red-600" />
                    Khóa Quyền Truy Cập (Block)
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Khóa học <span className="text-red-500">*</span></label>
                    <select 
                      value={selectedBlockCourseId}
                      onChange={(e) => setSelectedBlockCourseId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    >
                      <option value="">-- Chọn khóa học cần khóa --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Thời hạn</label>
                      <select 
                        value={blockExpiryDays}
                        onChange={(e) => setBlockExpiryDays(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                      >
                        <option value="">Vĩnh viễn (Không thời hạn)</option>
                        <option value="7">7 Ngày</option>
                        <option value="14">14 Ngày</option>
                        <option value="30">30 Ngày</option>
                        <option value="90">90 Ngày</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lý do khóa <span className="text-red-500">*</span></label>
                    <textarea 
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Ghi rõ lý do chặn (VD: Phát hiện dùng chung tài khoản...)"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleBlock}
                        disabled={blocking || !selectedBlockCourseId || blockReason.trim().length < 10}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {blocking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                        Khóa quyền xem khóa học
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Revoke Modal */}
      {revokeModalOpen && revokingOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Xác nhận thu hồi</h3>
              </div>
              
              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Khóa học</span>
                  <div className="font-medium">{revokingOverride.course_title}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Quyền</span>
                    <div className="font-medium text-blue-600 uppercase">{revokingOverride.access_scope}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Ngày hết hạn hiện tại</span>
                    <div className="font-medium">{revokingOverride.expires_at ? new Date(revokingOverride.expires_at).toLocaleDateString() : 'Vĩnh viễn'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gõ chính xác <span className="font-mono font-bold text-red-600 select-all">REVOKE_COURSE_ACCESS</span> để xác nhận
                  </label>
                  <input
                    type="text"
                    value={revokeConfirmText}
                    onChange={(e) => setRevokeConfirmText(e.target.value)}
                    placeholder="REVOKE_COURSE_ACCESS"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lý do thu hồi (Tối thiểu 10 ký tự)</label>
                  <textarea
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Lý do thu hồi quyền..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setRevokeModalOpen(false);
                  setRevokingOverride(null);
                  toast.info("Đã hủy thao tác thu hồi");
                }}
                disabled={revoking}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRevoke}
                disabled={revoking || revokeConfirmText !== "REVOKE_COURSE_ACCESS" || revokeReason.trim().length < 10}
              >
                {revoking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Thu Hồi Quyền
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
