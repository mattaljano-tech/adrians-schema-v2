{view === 'admin' && (
         <motion.section 
           key="admin"
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           transition={{ duration: 0.2 }}
         >
           <AdminTab 
             activities={activities}
             bankBalance={bankBalance}
             dailyMessage={dailyMessage}
             adminName={adminName}
           />
         </motion.section>
       )}